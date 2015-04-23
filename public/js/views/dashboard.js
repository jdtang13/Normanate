var essays = require('../controllers/essays');

module.exports = function() {
    $('#essay-table').on('click', 'tbody tr', function(event) {
        $(this).addClass('highlight').siblings().removeClass('highlight');
        window.essay = $(this).data('essay');
    });

    $('.essay-clicker').on('click', function(event) {
        var active = $('#editor-toggler label.active input').val();
        window.essay = $(this).parent().data('essay');
        window.location.href = '/essays/'+window.essay;
    });
    $('#quick-edit-button').click(function() {
        if ($(this).hasClass('disabled')) {
            return;
        }
        var active = $('#editor-toggler label.active input').val();
        window.location.href = '/essays/'+window.essay;
    });

    $('#delete-button-id').on('click', 'tbody tr', function(event) {
        window.essay = $(this).data('essay');
    });

    $('#confirm-delete-essay').click(function() {
        essays.deleteEssay({
            id: window.essay,
            _csrf: $('#confirm-delete-essay').data('csrf')
        }, function() {
            // success

            $('#' + window.essay + '-essay').remove();
            $('#quick-edit-button').addClass('disabled');
            $('#delete-button').addClass('disabled');
        }, function() {
            // error
        });
    });
};