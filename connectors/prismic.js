import config from 'config'
import Prismic from 'prismic-javascript'
import errors from '../static/errors'

export const prismicApi = async (query = null, req = null, pageSize = 20, currentPage = 1, extraQueryOptions = null) => {
  let documentType = 'id'
  let byValue
  let orderings
  let prismicQuery
  let queryOptions = {
    "pageSize": pageSize
  }

  if(extraQueryOptions) queryOptions = {...queryOptions, ...extraQueryOptions}

  if(!query){
    prismicQuery = ''
  } else {
    if(query.hasOwnProperty('_id')){
      byValue = query._id
    }
    if (query.hasOwnProperty('prismic_type')) {
      documentType = 'type'
      byValue = query.prismic_type
    }
    if(query.hasOwnProperty('prismic_tags')){
      documentType = 'tags'
      byValue = [query.prismic_tags]
    }
    prismicQuery = Prismic.Predicates.at('document.' + documentType, byValue)
  }
  try {
    const api = await Prismic.getApi(config.prismic.apiEndpoint,
      {
        req: req,
        accessToken: config.prismic.accessToken || ''
      })
    return await api.query(prismicQuery, queryOptions)
  }
  catch (err) {
    throw new Error(errors.prismicFetchErrorThrow + err)
  }
}
