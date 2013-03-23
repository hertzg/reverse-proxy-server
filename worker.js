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
            var title = statusCode + ' ' + http.STATUS_CODES[statusCode]
            res.writeHead(statusCode, {
                'Content-Type': 'text/html; charset=UTF-8',
            })
            sendPage({
                head: '<title>' + title + '</title>',
                body: '<h1>' + title + '</h1>'
            })
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
            var host = hosts[hostHeader]
            if (host) proxify(req, res, host)
            else sendErrorPage(404)
        }

    }).listen(port, host)

})
