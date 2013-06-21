function forEachKey (object, callback) {
    for (var i in object) {
        callback(object[i], i)
    }
}

module.exports = forEachKey
