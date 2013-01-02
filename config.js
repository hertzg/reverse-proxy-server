exports.port = 8080;

// Examples:
// exports.host = '';            // bind to all interfaces
// exports.host = '0.0.0.0';     // bind to all ipv4 interfaces
// exports.host = '::';          // bind to all ipv6 interfaces
// exports.host = '<ipAddress>'; // bind to a specific ip address
exports.host = '';

// Example:
// exports.hosts = {
//     'example.com': {
//         host: '127.0.0.1',
//         port: 8080,
//     },
//     'subdomain.example.com': {
//         host: '127.0.0.1',
//         port: 8080,
//     },
// }
exports.hosts = {
};

// Example:
// exports.redirectHosts = {
//    'www.example.com': 'http://example.com/',
//    'my.example.com': 'http://example.com/my',
//    'your.example.com': {
//        code: 301, // moved permanently
//        host: 'http://example.com/your',
//    },
//    'his.example.com': {
//        code: 307, // temporary redirect
//        host: 'http://example.com/his',
//    },
// };
// Note: Default code is 301 (moved permanently)
exports.redirectHosts = {
};

// Example:
// exports.removeHeaders = [
//     'pragma',
//     'server',
//     'x-powered-by',
// ];
exports.removeHeaders = [];
