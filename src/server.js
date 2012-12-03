var http = require('http'),
    url = require('url'),
    config = require('./config.js');

function createMap (objectMap) {
    var map = Object.create(null);
    for (var i in objectMap) {
        map[i] = objectMap[i];
    }
    return map;
}

var hosts = createMap(config.hosts),
    redirectHosts = createMap(config.redirectHosts);

http.createServer(function (req, res) {

    function proxify (req, res, host) {

        var requestConfig = {
            host: host.host,
            port: host.port,
            method: req.method,
            path: req.url,
            headers: req.headers
        };

        var proxyReq = http.request(requestConfig, function (proxyRes) {

            errorHandler = function () {
                res.end();
            };

            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.on('data', function (data) {
                res.write(data);
            });
            proxyRes.on('end', function () {
                res.end();
            });

        });

        var errorHandler = function () {
            sendError(502);
        };

        proxyReq.on('error', function () {
            errorHandler.apply(this, arguments);
        });

        req.on('data', function (data) {
            proxyReq.write(data);
        });
        req.on('end', function () {
            proxyReq.end();
        });

    }

    function sendError (statusCode) {
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(statusCode + ' ' + http.STATUS_CODES[statusCode]);
    }

    var hostHeader = req.headers['host'],
        redirectHost = redirectHosts[hostHeader];
    if (redirectHost) {
        res.writeHead(302, { location: redirectHost });
        res.end();
    } else {
        var host = hosts[hostHeader];
        if (host) proxify(req, res, host);
        else sendError(404);
    }

}).listen(config.port);
