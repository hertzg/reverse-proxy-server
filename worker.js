function createHtmlSender (statusCode, html) {
    return function (res) {
        res.statusCode = statusCode
        res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        res.end(html)
    }
}

function createHtml (head, body) {
    return '<!DOCTYPE html>' +
        '<html>' +
            '<head>' + head + '</head>' +
            '<body>' + body + '</body>' +
        '</html>'
}

var forEachKey = require('./lib/forEachKey.js'),
    htmlSpecialChars = require('./lib/htmlSpecialChars.js'),
    http = require('http')

process.on('message', function (initMessage) {

    function proxify (req, res, host) {

        function sendBadGateway () {
            host.sendBadGateway(res)
        }

        if (req.httpVersion == '1.0') {
            req.headers.connection = 'close'
        } else {
            req.headers.connection = 'keep-alive'
        }

        var xForwardedFor = req.headers['X-Forwarded-For']
        if (xForwardedFor) xForwardedFor += ', '
        else xForwardedFor = ''
        xForwardedFor += req.connection.remoteAddress
        req.headers['X-Forwarded-For'] = xForwardedFor

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
            var hostReplaceErrorPage = host.replaceErrorPages[statusCode]
            if (hostReplaceErrorPage) {
                proxyReq.abort()
                hostReplaceErrorPage(res)
            } else {
                var replaceErrorPage = replaceErrorPages[statusCode]
                if (replaceErrorPage) {
                    proxyReq.abort()
                    replaceErrorPage(res)
                } else {
                    res.writeHead(statusCode, proxyRes.headers)
                    proxyRes.pipe(res)
                }
            }

        })

        proxyReq.on('error', sendBadGateway)
        req.pipe(proxyReq)
        res.on('error', function () {
            proxyReq.removeListener('error', sendBadGateway)
            proxyReq.abort()
        })

    }

    var port = initMessage.port,
        host = initMessage.host,
        removeHeaders = initMessage.removeHeaders

    var errorPages = Object.create(null)
    forEachKey([404, 502], function (statusCode) {
        var html = initMessage.errorPages[statusCode]
        if (html) {
            errorPages[statusCode] = createHtmlSender(statusCode, html)
        } else {
            var title = statusCode + ' ' + http.STATUS_CODES[statusCode]
            var html = createHtml(
                '<title>' + title + '</title>',
                '<h1>' + title + '</h1>'
            )
            errorPages[statusCode] = createHtmlSender(statusCode, html)
        }
    })

    var errorPage404 = errorPages[404],
        errorPage502 = errorPages[502]

    var replaceErrorPages = Object.create(null)
    forEachKey(initMessage.replaceErrorPages, function (html, statusCode) {
        replaceErrorPages[statusCode] = createHtmlSender(statusCode, html)
    })

    var plainHosts = Object.create(null),
        regexHosts = []
    forEachKey(initMessage.hosts, function (host, i) {

        forEachKey(host.replaceErrorPages, function (html, statusCode) {
            host.replaceErrorPages[statusCode] = createHtmlSender(statusCode, html)
        })

        host.sendBadGateway = (function () {
            var html = host.errorPages[502]
            if (html) return createHtmlSender(502, html)
            return errorPage502
        })()

        var match = i.match(/^\/(.*)\/(.*?)$/)
        if (match) {
            regexHosts.push({
                regex: new RegExp(match[1], match[2]),
                forward: host,
            })
        } else {
            plainHosts[i] = host
        }
    })

    var redirectHosts = Object.create(null)
    forEachKey(initMessage.redirectHosts, function (redirectHost, hostname) {
        var statusCode = redirectHost.code
        var title = statusCode + ' ' + http.STATUS_CODES[statusCode]
        redirectHosts[hostname] = function (req, res) {
            var location = redirectHost.host + req.url
            res.statusCode = statusCode
            res.setHeader('Content-Type', 'text/html; charset=UTF-8')
            res.setHeader('Location', location)
            res.end(
                createHtml(
                    '<title>' + title + '</title>',
                    '<h1>' + title + '</h1>' +
                    '<p>The document has moved <a href="' + htmlSpecialChars(location) + '">here</a>.</p>'
                )
            )
        }
    })

    http.createServer(function (req, res) {
        var hostHeader = req.headers['host'],
            redirectHost = redirectHosts[hostHeader]
        if (redirectHost) {
            redirectHost(req, res)
        } else {
            var plainHost = plainHosts[hostHeader]
            if (plainHost) {
                proxify(req, res, plainHost)
            } else {
                for (var i in regexHosts) {
                    var regexHost = regexHosts[i]
                    if (regexHost.regex.test(hostHeader)) {
                        proxify(req, res, regexHost.forward)
                        return
                    }
                }
                errorPage404(res)
            }
        }
    }).listen(port, host)

})
