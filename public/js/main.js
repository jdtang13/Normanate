window.$ = window.jQuery = require('jquery');
require('expanding-textareas');
require('bootstrap');

var loader = require('./utils/load');
var essays = require('./controllers/essays');

window.highlightSuggestions = require('./utils/highlight-suggestions');


$(document).ready(function() {

    $(".expanding").expanding();

    require('./views/dashboard')();

  // Place JavaScript code here...
  $('#create-essay-button').click(function() {
    loader.load();
    var essayTitle = $('#title').val();
    var essayBody = $('#content').val();
    if (! essayTitle || !essayTitle.length) {
        
        //  autodetect essay title
        var lines = essayBody.split("\n");
        var detected = 0;
        if (lines[0].length < 30) {
            essayTitle = lines[0];
            detected = 1;
        }
        else {
            essayTitle = 'Untitled';
        }

        //  strip the autotitle from the body
        if (detected) {
            essayBody = essayBody.substring(essayTitle.length + 1);
        }

    }
    essays.createEssay({
        title: essayTitle,
        _csrf: $('#create-essay-button').data('csrf'),
        content: essayBody
    }, function(err) {
        console.log(err)
    });
  });

  $('#update-essay-button').click(function() {
    if (!window.essay) {
        return;
    }
    loader.load();
    var essayTitle = $('#title').val();
    if (! essayTitle || !essayTitle.length) {
        essayTitle = 'Untitled';
    }
    essays.updateEssay({
        title: essayTitle,
        _csrf: $('#update-essay-button').data('csrf'),
        content: $('#content').val()
    }, function(err) {
        console.log(err)
    });
  });

});