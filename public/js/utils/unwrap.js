
function unwrap(cssClass) {
    $(cssClass).replaceWith(function() { 
                    return this.innerHTML; });
}

module.exports = unwrap;