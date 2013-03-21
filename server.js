var cluster = require('cluster'),
    fs = require('fs'),
    http = require('http'),
    os = require('os'),
    url = require('url')

function htmlspecialchars (s) {
    s = s.replace(/&/g, '&amp;')
    s = s.replace(/</g, '&lt;')
    s = s.replace(/>/g, '&gt;')
    s = s.replace(/"/g, '&quot;')
    s = s.replace(/'/g, '&#039;')
    return s
}

process.chdir(__dirname)

if (cluster.isMaster) {
    (function () {

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

        var defaultPages = {
            301: fs.readFileSync('default-pages/301.html', 'utf8'),
            307: fs.readFileSync('default-pages/307.html', 'utf8'),
            404: fs.readFileSync('default-pages/404.html', 'utf8'),
            502: fs.readFileSync('default-pages/502.html', 'utf8'),
        }

        var initMessage = {
            host: config.host,
            port: config.port,
            hosts: hosts,
            redirectHosts: redirectHosts,
            removeHeaders: removeHeaders,
            replaceErrorPages: replaceErrorPages,
            defaultPages: defaultPages,
        }

        var numCpus = os.cpus().length
        for (var i = 0; i < numCpus; i++) {
            var worker = cluster.fork()
            worker.on('online', function () {
                worker.send(initMessage)
            })
        }

    })()
} else {
    process.on('message', function (initMessage) {

        var port = initMessage.port,
            host = initMessage.host,
            hosts = initMessage.hosts,
            redirectHosts = initMessage.redirectHosts,
            removeHeaders = initMessage.removeHeaders,
            replaceErrorPages = initMessage.replaceErrorPages,
            defaultPages = initMessage.defaultPages

        http.createServer(function (req, res) {

            function proxify (req, res, host) {

                function sendBadGateway () {
                    sendError(502)
                }

                if (req.httpVersion == '1.0') {
                    req.headers.connection = 'close'
                } else {
                    req.headers.connection = 'keep-alive'
                }

                var requestConfig = {
                    host: host.host,
                    port: host.port,
                    method: req.method,
                    path: req.url,
                    headers: req.headers,
                }

                var proxyReq = http.request(requestConfig, function (proxyRes) {

                    proxyReq.removeListener('error', sendBadGateway)
                    proxyReq.on('error', function () {
                        res.end()
                    })

                    for (var i in removeHeaders) {
                        delete proxyRes.headers[removeHeaders[i]]
                    }

                    var statusCode = proxyRes.statusCode
                    var replaceErrorPage = replaceErrorPages[statusCode]
                    if (replaceErrorPage) {
                        res.statusCode = statusCode
                        res.end(replaceErrorPage)
                        proxyReq.abort()
                    } else {
                        res.writeHead(statusCode, proxyRes.headers)
                        proxyRes.on('data', function (data) {
                            res.write(data)
                        })
                        proxyRes.on('end', function () {
                            res.end()
                        })
                    }

                })

                proxyReq.on('error', sendBadGateway)
                req.on('data', function (data) {
                    proxyReq.write(data)
                })
                req.on('end', function () {
                    proxyReq.end()
                })
                res.on('error', function () {
                    proxyReq.removeListener('error', sendBadGateway)
                    proxyReq.abort()
                })

            }

            function sendError (statusCode) {
                var html = defaultPages[statusCode]
                res.writeHead(statusCode, {
                    'Content-Type': 'text/html; charset=UTF-8',
                })
                res.end(html)
            }

            var hostHeader = req.headers['host'],
                redirectHost = redirectHosts[hostHeader]
            if (redirectHost) {
                var code = redirectHost.code,
                    location = redirectHost.host + req.url,
                    html = defaultPages[code].replace(/\{location\}/g, htmlspecialchars(location))
                res.writeHead(code, {
                    'Content-Type': 'text/html; charset=UTF-8',
                    Location: location,
                })
                res.end(html)
            } else {
                var host = hosts[hostHeader]
                if (host) proxify(req, res, host)
                else sendError(404)
            }

        }).listen(port, host)

    })
}
