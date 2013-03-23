function htmlspecialchars (s) {
    s = s.replace(/&/g, '&amp;')
    s = s.replace(/</g, '&lt;')
    s = s.replace(/>/g, '&gt;')
    s = s.replace(/"/g, '&quot;')
    s = s.replace(/'/g, '&#39;')
    return s
}

var http = require('http')

process.on('message', function (initMessage) {

    var port = initMessage.port,
        host = initMessage.host,
        hosts = initMessage.hosts,
        redirectHosts = initMessage.redirectHosts,
        removeHeaders = initMessage.removeHeaders,
        replaceErrorPages = initMessage.replaceErrorPages

    var plainHosts = Object.create(null),
        regexHosts = [];
    (function () {
        for (var i in hosts) {
            var host = hosts[i]
            var match = i.match(/^\/(.*)\/(.*?)$/)
            if (match) {
                regexHosts.push({
                    regex: new RegExp(match[1], match[2]),
                    forward: host,
                })
            } else {
                plainHosts[i] = host
            }
        }
    })()

    http.createServer(function (req, res) {

        function proxify (req, res, host) {

            function sendBadGateway () {
                sendErrorPage(502)
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
                    proxyRes.pipe(res)
                }

            })

            proxyReq.on('error', sendBadGateway)
            req.pipe(proxyReq)
            res.on('error', function () {
                proxyReq.removeListener('error', sendBadGateway)
                proxyReq.abort()
            })

        }

        function sendErrorPage (statusCode) {
            res.writeHead(statusCode, {
                'Content-Type': 'text/html; charset=UTF-8',
            })
            var replaceErrorPage = replaceErrorPages[statusCode]
            if (replaceErrorPage) {
                res.end(replaceErrorPage)
            } else {
                var title = statusCode + ' ' + http.STATUS_CODES[statusCode]
                sendPage({
                    head: '<title>' + title + '</title>',
                    body: '<h1>' + title + '</h1>'
                })
            }
        }

        function sendPage (e) {
            res.end(
                '<!DOCTYPE html>' +
                '<html>' +
                    '<head>' + e.head + '</head>' +
                    '<body>' + e.body + '</body>' +
                '</html>'
            )
        }

        var hostHeader = req.headers['host'],
            redirectHost = redirectHosts[hostHeader]
        if (redirectHost) {
            var statusCode = redirectHost.code,
                title = statusCode + ' ' + http.STATUS_CODES[statusCode],
                location = redirectHost.host + req.url
            res.writeHead(statusCode, {
                'Content-Type': 'text/html; charset=UTF-8',
                Location: location,
            })
            sendPage({
                head: '<title>' + title + '</title>',
                body: '<h1>' + title + '</h1>' +
                    '<p>The document has moved <a href="' + htmlspecialchars(location) + '">here</a>.</p>'
            })
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
                sendErrorPage(404)
            }
        }

    }).listen(port, host)

})
