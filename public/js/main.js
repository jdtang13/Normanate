window.$ = window.jQuery = require('jquery');
require('expanding-textareas');
require('bootstrap');

function createEssay(data, error) {
    // Create a piece, redirect to editing that piece
    $.ajax({
        url: '/essays',
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        success: function(essay) {
            console.log(essay);
            window.location.replace('/essays/'+essay.id);
        },
        error: error
    });
}

$(document).ready(function() {

    $(".expanding").expanding();

  // Place JavaScript code here...
  $('#create-essay-button').click(function() {
    var essayTitle = $('#title').val();
    if (! essayTitle || !essayTitle.length) {
        essayTitle = 'Untitled';
    }
    createEssay({
        title: essayTitle,
        _csrf: $('#create-essay-button').data('csrf'),
        content: $('#content').val()
    }, function(err) {
        console.log(err)
    });
  });

});