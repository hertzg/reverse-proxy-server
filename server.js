var fs = require('fs'),
    http = require('http'),
    url = require('url');

var verbose = process.argv.indexOf('-v') != -1;

var config = (function () {
    var homeDir = process.env.HOME;
    var configFile = homeDir + '/.reverse-proxy-server/config.js';
    if (!fs.existsSync(configFile)) {
        configFile = './config.js';
    }
    if (verbose) {
        console.log('Reading config file from "' + configFile + '".');
    }
    return require(configFile);
})();

function createMap (objectMap) {
    var map = Object.create(null);
    for (var i in objectMap) {
        map[i] = objectMap[i];
    }
    return map;
}

var removeHeaders = config.removeHeaders;
var hosts = createMap(config.hosts);

var redirectHosts = Object.create(null);
(function () {
    for (var i in config.redirectHosts) {
        var redirectHost = config.redirectHosts[i];
        if (typeof redirectHost == 'string') {
            redirectHost = { code: 301, host: redirectHost };
        }
        redirectHosts[i] = redirectHost;
    }
})();

http.createServer(function (req, res) {

    function proxify (req, res, host) {

        function sendBadGateway () {
            sendError(502);
        }

        var requestConfig = {
            host: host.host,
            port: host.port,
            method: req.method,
            path: req.url,
            headers: req.headers,
        };

        var proxyReq = http.request(requestConfig, function (proxyRes) {

            proxyReq.removeListener('error', sendBadGateway);
            proxyReq.on('error', function () {
                res.end();
            });

            for (var i in removeHeaders) {
                delete proxyRes.headers[removeHeaders[i]];
            }

            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);

        });

        proxyReq.on('error', sendBadGateway);
        req.pipe(proxyReq);

    }

    function sendError (statusCode) {
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(statusCode + ' ' + http.STATUS_CODES[statusCode]);
    }

    var hostHeader = req.headers['host'],
        redirectHost = redirectHosts[hostHeader];
    if (redirectHost) {
        res.writeHead(redirectHost.code, {
            location: redirectHost.host + req.url,
        });
        res.end();
    } else {
        var host = hosts[hostHeader];
        if (host) proxify(req, res, host);
        else sendError(404);
    }

}).listen(config.port, config.host);

if (verbose) {
    console.log('Listening to port ' + config.port + '.');
}
