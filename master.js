function fork () {
    var worker = cluster.fork()
    worker.on('online', function () {
        worker.on('exit', fork)
        worker.send(initMessage)
    })
}

function readErrorPage (errorPages, statusCode, filename) {
    try {
        errorPages[statusCode] = fs.readFileSync(filename, 'utf8')
    } catch (e) {
        console.error('Failed to read error page "' + filename + '"')
    }
}

process.chdir(__dirname)

var cluster = require('cluster'),
    fs = require('fs'),
    os = require('os'),
    forEachKey = require('./lib/forEachKey.js')

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
forEachKey(config.hosts, function (host, hostname) {

    var errorPages = Object.create(null)
    forEachKey(host.errorPages, function (filename, statusCode) {
        readErrorPage(errorPages, statusCode, filename)
    })

    var replaceErrorPages = Object.create(null)
    forEachKey(host.replaceErrorPages, function (filename, statusCode) {
        readErrorPage(replaceErrorPages, statusCode, filename)
    })

    hosts[hostname] = {
        host: host.host,
        port: host.port,
        errorPages: errorPages,
        replaceErrorPages: replaceErrorPages,
    }

})

var redirectHosts = Object.create(null)
forEachKey(config.redirectHosts, function (redirectHost, hostMatch) {
    if (typeof redirectHost == 'string') {
        redirectHost = { code: 301, host: redirectHost }
    }
    redirectHosts[hostMatch] = redirectHost
})

var removeHeaders = []
forEachKey(config.removeHeaders, function (headerName) {
    headerName = headerName.toLowerCase()
    if (removeHeaders.indexOf(headerName) == -1) {
        removeHeaders.push(headerName)
    }
})

var errorPages = Object.create(null)
forEachKey(config.errorPages, function (filename, statusCode) {
    readErrorPage(errorPages, statusCode, filename)
})

var replaceErrorPages = Object.create(null)
forEachKey(config.replaceErrorPages, function (filename, statusCode) {
    readErrorPage(replaceErrorPages, statusCode, filename)
})

var initMessage = {
    host: config.host,
    port: config.port,
    hosts: hosts,
    redirectHosts: redirectHosts,
    removeHeaders: removeHeaders,
    errorPages: errorPages,
    replaceErrorPages: replaceErrorPages,
}

var numCpus = os.cpus().length
for (var i = 0; i < numCpus; i++) fork()
