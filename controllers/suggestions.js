// helper module for write-good


var writeGood = require('write-good');


exports.getSuggestions = function(essay) {

    var suggestions = writeGood(essay.content);
    var s = {
        weasel: [],
        illusion: [],
        so: [],
        thereIs: [],
        passive: [],
        adverb: [],
        tooWordy: [],
        cliches: []
    };

    for (var i = 0; i < suggestions.length; i++) {
        var reason = suggestions[i].reason;
        var suggestion = suggestions[i];
        if (reason.indexOf('weasel') > -1) {
            s.weasel.push(suggestion);
            continue;
        }

        if (reason.indexOf('repeated') > -1) {
            s.illusion.push(suggestion);
            continue;
        }

        if (reason.indexOf('no meaning') > -1) {
            s.so.push(suggestion);
            continue;
        }

        if (reason.indexOf('verbiage') > -1) {
            s.thereIs.push(suggestion);
            continue;
        }

        if (reason.indexOf('passive') > -1) {
            s.passive.push(suggestion);
            continue;
        }

        if (reason.indexOf('weaken meaning') > -1) {
            s.adverb.push(suggestion);
            continue;
        }

        if (reason.indexOf('wordy') > -1) {
            s.tooWordy.push(suggestion);
            continue;
        }

        if (reason.indexOf('cliche') > -1) {
            s.cliches.push(suggestion);
            continue;
        }
    }

    return s;
}