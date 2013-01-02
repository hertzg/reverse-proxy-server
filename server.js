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

var removeHeaders = config.removeHeaders || [];

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

            removeHeaders.forEach(function (headerName) {
                delete proxyRes.headers[headerName];
            });

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
    	var redirectCode = 301;
    	var targetHost = redirectHost;
    	
		if(typeof redirectHost == "object") {
			redirectCode = redirectHost.code || 301;
			targetHost = redirectHost.host;
		}
    
        res.writeHead(redirectCode, {
            location: targetHost + req.url,
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
