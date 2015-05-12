window.rangy = require('rangy');
var async = require('async');
var highlightSuggestions = require('../utils/highlight-suggestions');
var unwrap = require('../utils/unwrap');

var loader = require('../utils/load');

$(document).ready(function() {

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
    $(".switch-check").bootstrapSwitch({
        size: 'mini',
        onText: 'Show',
        offText: 'Hide'
    });

    $('.switch-check').on('switchChange.bootstrapSwitch', function(event, state) {
      
        var id = $(this).attr('id');

        switch (id) {
            case 'passive-check': 
                if (state == false) {
                    unwrap('.highlight-passive');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.passive, "highlight-passive", loader.unload);
                }
            break;
            case 'weasel-check': 
                if (state == false) {
                    unwrap('.highlight-weasel');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.weasel, "highlight-weasel", loader.unload);
                }
            break;
            case 'repeated-check': 
                if (state == false) {
                    unwrap('.highlight-illusion');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.illusion, "highlight-illusion", loader.unload);
                }
            break;
            case 'cliche-check': 
                if (state == false) {
                    unwrap('.highlight-cliches');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.cliches, "highlight-cliches", loader.unload);
                }
            break;
            case 'adverb-check': 
                if (state == false) {
                    unwrap('.highlight-adverb');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.adverb, "highlight-adverb", loader.unload);
                }
            break;
            case 'wordy-check': 
                if (state == false) {
                    unwrap('.highlight-wordy');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.tooWordy, "highlight-wordy", loader.unload);
                }
            break;
            case 'so-check': 
                if (state == false) {
                    unwrap('.highlight-so');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.so, "highlight-so", loader.unload);
                }
            break;
            case 'there-check': 
                if (state == false) {
                    unwrap('.highlight-thereIs');
                }
                else {
                    loader.load();
                    highlightSuggestions(e, window.suggestions.thereIs, "highlight-thereIs", loader.unload);
                }
            break;
        }
    });

    var e = ".essay-content";
    loader.load();
    setTimeout(function() {
        async.parallel([
        function(callback) {
                highlightSuggestions(e, window.suggestions.passive, "highlight-passive", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.illusion, "highlight-illusion", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.so, "highlight-so", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.thereIs, "highlight-thereIs", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.adverb, "highlight-adverb", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.tooWordy, "highlight-wordy", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.cliches, "highlight-cliches", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.weasel, "highlight-weasel", callback);
            }
        ], function(err, results) {
            loader.unload();
            rangy.getSelection().removeAllRanges();
        });
    }, 10);
    
});
    
