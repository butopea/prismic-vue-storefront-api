import config from 'config'
import info from '../static/info'
import { prismicApi } from '../connectors/prismic'
import { elasticSearchClient, saveToElasticSearch } from '../connectors/es'
import fs from 'fs'
import axios from 'axios'
import crypto from 'crypto'
import imageType from 'image-type'
import isSvg from 'is-svg'

const urlPath = '/api/ext/prismic/images'

const download = async (url, path, filename) => {
  let fileName = filename
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer'
  })
  const imageBuffer = Buffer.from(response.data, 'binary')
  let imageExt = imageType(imageBuffer)
  if (imageExt == null && isSvg(imageBuffer)) {
    imageExt = {
      ext: 'svg',
      mime: 'image/svg+xml'
    }
  }
  if ('ext' in imageExt) {
    fileName = `${fileName}.${imageExt['ext']}`
  }
  await fs.writeFileSync(`${path}/${fileName}`, imageBuffer)
  return fileName
}

async function cacheImages (results) {
  // eslint-disable-next-line no-useless-escape
  const regexUrl = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gi
  const regexImages = /\.(?:jpg|gif|png|jpeg|svg|webp)/

  let esJson = JSON.stringify(results)

  let urls = esJson.match(regexUrl)
  let imageUrls = urls.filter(element => element.match(regexImages))

  let tmpDir = '/tmp/prismic-images'

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  await Promise.all(Object.values(imageUrls).map(async (imageUrl) => {
    let fileHash = crypto.createHash('md5').update(imageUrl).digest('hex')
    let fileName = await download(imageUrl, tmpDir, fileHash)
    esJson = esJson.replace(imageUrl, `${urlPath}/${fileName}`)
  }));

  return JSON.parse(esJson)
}

// TODO: implement a feature to only update the added/updated/deleted items [requires users to always use a Prismic release]
// Current approach: delete all the items of type prismic in every listed index and repopulate the data
// TODO: Use a queueing system (Kue) for repositories with a large number of documents [currently unnecessary]

export const syncPrismic = async (currentPage = null) => {
  if (!currentPage) {
    await elasticSearchClient().deleteByQuery({ // TODO: deleteByQuery without an explicit query is deprecated on ES 6+. Use _doc feature of ES 7 when VSF 1.11.0 gets released
      index: config.elasticsearch.indices,
      type: 'prismic'
    }).then(() => {
      console.log(info.syncDbCleared + config.elasticsearch.indices.join(','))
    })
  }

  const fetchedPage = await prismicApi(null, null, config.extensions.prismic.syncPageSize, currentPage)

  const newJson = await cacheImages(fetchedPage.results)

  await saveToElasticSearch(newJson)

  console.log(info.syncPageComplete + fetchedPage.total_results_size + ' [' + fetchedPage.page + '/' + fetchedPage.total_pages + ']')

  if (fetchedPage.page && !fetchedPage.next_page) {
    return info.syncComplete
  } else {
    syncPrismic(currentPage + 1)
  }
}
