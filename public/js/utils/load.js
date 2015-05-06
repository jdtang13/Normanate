
        
module.exports = {
    init: function() {

        var centerLoader = '<div class="loaderWrapper" id="loading"><p>Processing...</p><div class="loader">Loading...</div></div>';
        var centerError = '<div class="loaderWrapper" id="err"><p>An Error Occurred.</p><div class="text-center danger-color"><br><i class="fa fa-remove fa-5x"></i></div></div>';
        
        $('body').append($(centerLoader));
        $('body').append($(centerError));
        $('#loading').hide();
        $('#err').hide();
    },
    load: function(cb) {
        $('#loading').fadeIn();
        if (cb) {
            cb();
        }
    },
    error: function() {
        $('#loading').hide();
        $('#err').show();
        window.setTimeout(function() {
            $('#err').fadeOut();
        }, 2000);
    },
    unload: function() {
        $('#loading').fadeOut();
    }
};