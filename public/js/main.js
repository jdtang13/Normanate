window.$ = window.jQuery = require('jquery');
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

  // Place JavaScript code here...
  $('#create-essay-button').click(function() {
    createEssay({
        title: 'Untitled',
        _csrf: $('#create-essay-button').data('csrf'),
        content: 'Lorem ipsum.'
    }, function(err) {
        console.log(err)
    });
  });

});