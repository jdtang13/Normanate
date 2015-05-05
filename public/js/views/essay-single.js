window.rangy = require('rangy');
var async = require('async');
var highlightSuggestions = require('../utils/highlight-suggestions');

var loader = require('../utils/load');

$(document).ready(function() {
    var e = ".essay-content";
    loader.load();
    setTimeout(function() {
        async.parallel([
        function(callback) {
                highlightSuggestions(e, window.suggestions.passive, "h-passive", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.illusion, "h-illusion", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.so, "h-so", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.adverb, "h-adverb", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.tooWordy, "h-wordy", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.cliches, "h-cliches", callback);
            },
            function(callback) {
                highlightSuggestions(e, window.suggestions.weasel, "h-weasel", callback);
            }
        ], function(err, results) {
            loader.unload();
        });
    }, 10);
    
});
    
