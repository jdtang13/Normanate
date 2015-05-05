require('../vendor/rangy-textrange');
require('../vendor/rangy-classapplier');



function highlightSuggestions($element, suggestions, cssClass, callback) {
    cssClass = cssClass || "highlighted";
    var selection = rangy.getSelection();
    var highlightApplier = rangy.createCssClassApplier(cssClass, true);

    var busy = false;

    $element = $($element);
    
    // load the highlights asynchronously with the preloader
    var i = 0;
    var limit = suggestions.length;
    var processor = setInterval(function() 
    { 
        if(!busy) 
        { 
            if(i >= limit) 
            { 
                clearInterval(processor); 
                if (callback) {
                    callback();
                }
            } 
            else {
                busy = true; 

                selection.removeAllRanges();
                var sug = suggestions[i];
                if (sug) {
                    selection.selectCharacters($element[0], sug.index, sug.index + sug.offset);
                    highlightApplier.applyToSelection();

                }
                
                i++;
                busy = false; 

            }
            
        } 

    }, 1); 
    
    
}

module.exports = highlightSuggestions;