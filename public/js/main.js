window.$ = window.jQuery = require('jquery');
require('expanding-textareas');
require('bootstrap');

var essays = require('./controllers/essays');
$(document).ready(function() {

    $(".expanding").expanding();

    require('./views/dashboard')();

  // Place JavaScript code here...
  $('#create-essay-button').click(function() {
    var essayTitle = $('#title').val();
    if (! essayTitle || !essayTitle.length) {
        essayTitle = 'Untitled';
    }
    essays.createEssay({
        title: essayTitle,
        _csrf: $('#create-essay-button').data('csrf'),
        content: $('#content').val()
    }, function(err) {
        console.log(err)
    });
  });

  $('#update-essay-button').click(function() {
    if (!window.essay) {
        return;
    }
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