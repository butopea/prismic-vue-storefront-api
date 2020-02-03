const config = require('config')
const program = require('commander')
const info = require('../static/info')
// import { syncPrismic} from './helpers/sync'

program
  .option('--index <index>', 'name of index', config.elasticsearch.indices[0])
  .action((cmd) => {
    const index = cmd.index ? cmd.index : cmd.options[0].defaultValue
    console.log('TODO')
  })

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})

process.on('uncaughtException', (exception) => {
  console.log(exception)
})
