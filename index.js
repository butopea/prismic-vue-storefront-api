import { Router } from 'express'
import errors from './static/errors'
import { checkConfig } from './helpers/config'
import { apiStatus } from '../../../lib/util'
import { prismicApi } from './connectors/prismic';
import { syncPrismic} from './helpers/sync'

module.exports = ({ config }) => {

  /* ------- Initialization ------- */
  checkConfig(config)

  const api = Router()

  /* ------- Routes ------- */

  // Search for a document
  api.post('/search', (req, res) => {
    return apiStatus(res, {}, 200)
  })

  // Receive webhook callbacks
  api.post('/webhook', (req, res) => {
    if(!req.body) return apiStatus(res, errors.invalidWebhookCallback, 400)
    if(!req.body.type || !['api-update', 'test-update'].includes(req.body.type)) apiStatus(res, errors.invalidWebhookCallback, 400)
    if(!req.body.secret || req.body.secret !== config.prismic.webhookSecret) return apiStatus(res, errors.invalidWebhookSecret, 401)

    syncPrismic().then(result => {
      return apiStatus(res, result, 200)
    }).catch(err => {
      console.error(errors.syncError, err)
      return apiStatus(res, errors.syncError, 500)
    })

  })

  return api

}
