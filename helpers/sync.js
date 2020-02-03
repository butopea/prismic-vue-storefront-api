import config from 'config'
import info from '../static/info'
import { prismicApi } from '../connectors/prismic'
import { elasticSearchClient, saveToElasticSearch } from '../connectors/es'

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

  await saveToElasticSearch(fetchedPage.results)

  console.log(info.syncPageComplete + fetchedPage.total_results_size + ' [' + fetchedPage.page + '/' + fetchedPage.total_pages + ']')

  if (fetchedPage.page && !fetchedPage.next_page) {
    return info.syncComplete
  } else {
    syncPrismic(currentPage + 1)
  }
}
