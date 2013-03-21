var cluster = require('cluster')

process.chdir(__dirname)

if (cluster.isMaster) {
    require('./master.js')
} else {
    require('./worker.js')
}
