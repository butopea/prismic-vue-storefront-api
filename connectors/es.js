import elasticsearch from 'elasticsearch'
import config from 'config'
import errors from '../static/errors'
import { prismicFieldPrefix } from '../helpers/processors'

const getIndexByLanguage = (language) => {
  return config.extensions.prismic.indexToLocale.find(el => el.language === language) || elasticSearchIndex()
}

const elasticSearchIndex = (indexName) => {
  if (!indexName) {
    if (config.elasticsearch.indices[0]) {
      return config.elasticsearch.indices[0]
    }
    throw new Error(errors.esErrorNoIndex)
  } else {
    if (config.elasticsearch.indices.indexOf(indexName) < 0) {
      throw new Error(errors.esErrorInaccessibleIndex)
    }
    return indexName
  }
}

const elasticSearchClient = () => {
  if (config.elasticsearch.host && config.elasticsearch.port) {
    const client = new elasticsearch.Client({
      host: [
        `http://${config.elasticsearch.host}:${config.elasticsearch.port}/`
      ]
    })
    client.cluster.health({}, (err, resp) => {
      if (!resp) {
        throw new Error(errors.esErrorConnection)
      }
    })
    return client
  } else {
    throw new Error(errors.esErrorAuth)
  }
}

const saveToElasticSearch = (prismicData) => {
  for (let element of prismicData) {
    // TODO: Use the schema-less _doc feature of ES 7 when VSF 1.11.0 gets released
    elasticSearchClient().index({
      index: getIndexByLanguage(prismicData.lang),
      id: element.id,
      type: 'prismic',
      body: prismicFieldPrefix(element)
    }, (err) => {
      if (err) {
        throw new Error(errors.esError + err)
      }
    })
  }
}

export { elasticSearchIndex, elasticSearchClient, saveToElasticSearch }
