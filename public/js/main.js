// dependencies
window.$ = window.jQuery = require('jquery');
require('expanding-textareas');
require('bootstrap');
require('bootstrap-switch');
require('./vendor/bootstrap-growl');

var count = require('../../utils/count');

var loader = require('./utils/load');
var essays = require('./controllers/essays');

require('./vendor/lightbox');


$(document).ready(function() {

    $('.fluidbox').lightbox();

    loader.init();

    // initialize the dashboard code - just a bunch of event listeners, so
    // shouldn't be too bloated
    require('./views/dashboard')();

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
            loader.error();
            if ($.isArray(err.responseJSON)) {
                for (var error in err.responseJSON) {
                    $.bootstrapGrowl(err.responseJSON[error].message, {
                        delay: 2000,
                        type: 'danger',
                        allow_dismiss: true,
                        offset: {from: 'bottom', amount: 20}});
                }
            }
            else {
                $.bootstrapGrowl(err.responseJSON.message, {
                    delay: 2000,
                    type: 'danger',
                    allow_dismiss: true,
                    offset: {from: 'bottom', amount: 20}});
            }
        
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
        loader.error();
        if ($.isArray(err.responseJSON)) {
            for (var error in err.responseJSON) {
                $.bootstrapGrowl(err.responseJSON[error].message, {
                    delay: 2000,
                    type: 'danger',
                    allow_dismiss: true,
                    offset: {from: 'bottom', amount: 20}});
            }
        }
        else {
            $.bootstrapGrowl(err.responseJSON.message, {
                delay: 2000,
                type: 'danger',
                allow_dismiss: true,
                offset: {from: 'bottom', amount: 20}});
        }
            
        
    });
  });

    

});

// word and character counter
////////////////////////////////

// hack together method to listen to textarea onchange
// http://stackoverflow.com/a/14029861
var area = $('#content')[0];
if (area) {
    if (area.addEventListener) {
      area.addEventListener('input', function() {
        updateCounter();
      }, false);
    } else if (area.attachEvent) {
      area.attachEvent('onpropertychange', function() {
        updateCounter();
      });
    }

}

function updateCounter() {
    var essayCount = count($('.essay-content').val() || "");
    console.log(essayCount);
    $('#word-count').text(essayCount.words);
    $('#char-count').text(essayCount.characters);
}

window.updateCounter = updateCounter;