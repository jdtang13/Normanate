// remove a class but keep its contents
function unwrap(cssClass) {
    $(cssClass).replaceWith(function() { 
                    return this.innerHTML; });
}

module.exports = unwrap;