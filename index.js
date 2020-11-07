import { Router } from 'express'
import errors from './static/errors'
import { checkConfig } from './helpers/config'
import { apiStatus } from '../../../lib/util'
import { prismicApi } from './connectors/prismic';
import { syncPrismic } from './helpers/sync'
import Path from 'path'

module.exports = ({ config }) => {
  /* ------- Initialization ------- */
  checkConfig(config)

  const api = Router()

  /* ------- Routes ------- */
  // Receive webhook callbacks
  api.post('/webhook', (req, res) => {
    if (!req.body) return apiStatus(res, errors.invalidWebhookCallback, 400)
    if (!req.body.type || !['api-update', 'test-update', 'test-trigger'].includes(req.body.type)) apiStatus(res, errors.invalidWebhookCallback, 400)
    if (!req.body.secret || req.body.secret !== config.extensions.prismic.webhookSecret) return apiStatus(res, errors.invalidWebhookSecret, 401)

    syncPrismic().then(result => {
      return apiStatus(res, result, 200)
    }).catch(err => {
      console.error(errors.syncError, err)
      return apiStatus(res, errors.syncError, 500)
    })
  })

  api.get('/images/:name', function (req, res, next) {
    var options = {
      root: Path.join('/tmp/prismic-images'),
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    }

    var fileName = req.params.name
    res.sendFile(fileName, options, function (err) {
      if (err) {
        next(err)
      } else {
        console.log('Sent:', fileName)
      }
    })
  })

  return api
}
