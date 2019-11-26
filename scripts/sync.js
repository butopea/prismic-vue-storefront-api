import config from 'config'
import program from 'commander'
import { syncPrismic} from './helpers/sync'

program
    .option('--index <index>', 'name of index', config.elasticsearch.indices[0])
    .action((cmd) => {
        console.log("IT WORKS!", cmd)
    })

program
    .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason)
})

process.on('uncaughtException', function(exception) {
    console.log(exception)
})

