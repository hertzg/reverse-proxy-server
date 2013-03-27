var cluster = require('cluster'),
    fs = require('fs'),
    os = require('os')

var verbose = process.argv.indexOf('-v') != -1

var config = (function () {
    var homeDir = process.env.HOME
    var configFile = homeDir + '/.reverse-proxy-server/config.js'
    if (!fs.existsSync(configFile)) {
        configFile = './config.js'
    }
    if (verbose) {
        console.log('Reading config file from "' + configFile + '".')
    }
    return require(configFile)
})()

var hosts = Object.create(null)
for (var i in config.hosts) {
    hosts[i] = config.hosts[i]
}

var redirectHosts = Object.create(null)
for (var i in config.redirectHosts) {
    var redirectHost = config.redirectHosts[i]
    if (typeof redirectHost == 'string') {
        redirectHost = { code: 301, host: redirectHost }
    }
    redirectHosts[i] = redirectHost
}

var removeHeaders = config.removeHeaders

var replaceErrorPages = Object.create(null)
for (var i in config.replaceErrorPages) {
    var filename = config.replaceErrorPages[i]
    try {
        replaceErrorPages[i] = fs.readFileSync(filename, 'utf8')
    } catch (e) {
        console.error('Failed to read error page "' + filename + '"')
    }
}

var initMessage = {
    host: config.host,
    port: config.port,
    hosts: hosts,
    redirectHosts: redirectHosts,
    removeHeaders: removeHeaders,
    replaceErrorPages: replaceErrorPages,
}

function fork () {
    var worker = cluster.fork()
    worker.on('online', function () {
        worker.on('exit', fork)
        worker.send(initMessage)
    })
}

var numCpus = os.cpus().length
for (var i = 0; i < numCpus; i++) fork()
