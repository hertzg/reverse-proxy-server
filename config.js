exports.port = 80

// Examples:
// exports.host = ''            // bind to all interfaces
// exports.host = '0.0.0.0'     // bind to all ipv4 interfaces
// exports.host = '::'          // bind to all ipv6 interfaces
// exports.host = '<ipAddress>' // bind to a specific ip address
exports.host = ''

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
//     '/^regex\\.example\\.com$/': {
//         host: '127.0.0.1',
//         port: 8080,
//     },
//     'another.example.com': {
//         host: '127.0.0.1',
//         port: 8080,
//         errorPages: {
//             502: 'error-pages/another.example.com/502-bad-gateway.html',
//         },
//         replaceErrorPages: {
//             403: 'replace-error-pages/another.example.com/403-forbidden.html',
//             404: 'replace-error-pages/another.example.com/404-not-found.html',
//             // ...
//         },
//     },
//     // ...
// }
exports.hosts = {
}

// Example:
// exports.redirectHosts = {
//    'www.example.com': 'http://example.com',
//    'my.example.com': 'http://example.com/my',
//    'your.example.com': {
//        code: 301, // moved permanently
//        host: 'http://example.com/your',
//    },
//    'his.example.com': {
//        code: 302, // found
//        host: 'http://example.com/his',
//    },
//    'her.example.com': {
//        code: 307, // temporary redirect
//        host: 'http://example.com/her',
//    },
//    // ...
// }
// Note 1: No trailing slashes are required
// Note 2: Default redirect code is 301 (moved permanently)
exports.redirectHosts = {
}

// Example:
// exports.removeHeaders = [
//     'pragma',
//     'server',
//     'x-powered-by',
//     // ...
// ]
exports.removeHeaders = [
]

// Example:
// exports.errorPages = {
//     404: 'error-pages/404-not-found.html',
//     502: 'error-pages/502-bad-gateway.html',
// }
exports.errorPages = {
}

// Example:
// exports.replaceErrorPages = {
//     403: 'replace-error-pages/404-forbidden.html',
//     404: 'replace-error-pages/404-not-found.html',
//     // ...
// }
exports.replaceErrorPages = {
}
