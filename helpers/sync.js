import config from 'config'
import info from '../static/info'
import { prismicApi } from '../connectors/prismic'
import { elasticSearchClient, saveToElasticSearch } from '../connectors/es'
import Axios from 'axios'
import Fs from 'fs'
import Path from 'path'

const urlPath = '/api/ext/prismic/images/'

// TODO: implement a feature to only update the added/updated/deleted items [requires users to always use a Prismic release]
// Current approach: delete all the items of type prismic in every listed index and repopulate the data
// TODO: Use a queueing system (Kue) for repositories with a large number of documents [currently unnecessary]

const pairPathname = data =>
  data.reduce((acc, item) => {
    let url = new URL(item)
    // eslint-disable-next-line
    let lastSlashRegex = /([^\/]+$)/
    acc[url.pathname.match(lastSlashRegex)[0]] = item

    return acc;
  }, {});

async function downloadImage (pathname, url) {
  const imgPath = Path.join(__dirname, '/../images/', pathname)
  const writer = Fs.createWriteStream(imgPath)

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

async function cacheImages (results) {
  // eslint-disable-next-line
  const regexUrl = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gi
  const regexImages = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|svg|webp)/

  let esJson = JSON.stringify(results)

  let urls = esJson.match(regexUrl)
  let imageUrls = urls.filter(element => element.match(regexImages))
  let pathnameArray = pairPathname(imageUrls)

  await Promise.all(Object.keys(pathnameArray).map(async (key) => {
    await downloadImage(key, pathnameArray[key])
    esJson = esJson.replace(pathnameArray[key], urlPath + key)
  }));

  return JSON.parse(esJson)
}

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
