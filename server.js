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

(function (hosts) {
    for (var i in hosts) {
        var host = hosts[i];
        if (typeof host == 'string') {
            hosts[i] = {
                code: 301,
                host: host,
            };
        }
    }
})(config.redirectHosts);
var redirectHosts = createMap(config.redirectHosts);

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

            for (var i in removeHeaders) {
                delete proxyRes.headers[removeHeaders[i]];
            }

            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);

        });

        var errorHandler = function () {
            sendError(502);
        };

        proxyReq.on('error', function () {
            errorHandler.apply(this, arguments);
        });

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
