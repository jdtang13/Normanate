var rangy = require('rangy');
require('../vendor/rangy-textrange');
require('../vendor/rangy-classapplier');
var loader = require('./load');

function highlightSuggestions($element, suggestions) {
    var selection = rangy.getSelection();
    var highlightApplier = rangy.createCssClassApplier("highlighted", true);

    $element = $($element);
    loader.load(function() {

        for (var i = 0; i < suggestions.length; i++) {
            selection.removeAllRanges();
            var sug = suggestions[i];
            selection.selectCharacters($element[0], sug.index, sug.index + sug.offset);
            highlightApplier.applyToSelection();
        }

        loader.unload();

    });

    
    
}

module.exports = highlightSuggestions;