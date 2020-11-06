import config from 'config'
import info from '../static/info'
import { prismicApi } from '../connectors/prismic'
import { elasticSearchClient, saveToElasticSearch } from '../connectors/es'
import fs from 'fs'
import request from 'request'
import Path from 'path'

const urlPath = '/api/ext/prismic/images/'

const download = (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}
const pairPathname = data =>
  data.reduce((acc, item) => {
    let url = new URL(item)
    // eslint-disable-next-line
    let lastSlashRegex = /([^\/]+$)/
    acc[url.pathname.match(lastSlashRegex)[0]] = item
    return acc;
}, {});

async function cacheImages (results) {
  const regexUrl = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gi
  const regexImages = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|svg|webp)/

  let esJson = JSON.stringify(results)

  let urls = esJson.match(regexUrl)
  let imageUrls = urls.filter(element => element.match(regexImages))
  let pathnameArray = pairPathname(imageUrls)

  await Promise.all(Object.keys(pathnameArray).map(async (key) => {
    let path = Path.join(__dirname, '/../images/', key)

    await download(pathnameArray[key], path, () => {
      console.log('Done!')
    })
    esJson = esJson.replace(pathnameArray[key], urlPath + key)
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
