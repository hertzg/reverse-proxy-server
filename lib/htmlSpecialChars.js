function htmlSpecialChars (s) {
    s = s.replace(/&/g, '&amp;')
    s = s.replace(/</g, '&lt;')
    s = s.replace(/>/g, '&gt;')
    s = s.replace(/"/g, '&quot;')
    s = s.replace(/'/g, '&#39;')
    return s
}

module.exports = htmlSpecialChars
