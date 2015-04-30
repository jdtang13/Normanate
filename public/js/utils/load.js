
var centerLoader = '<div class="loaderWrapper" id="loading"><p>Processing...</p><div class="loader">Loading...</div></div>';
$('body').append($(centerLoader));
        $('#loading').hide();
        
module.exports = {
    load: function(cb) {
        $('#loading').fadeIn();
        if (cb) {
            cb();
        }
    },
    unload: function() {
        $('#loading').fadeOut();
    }
};