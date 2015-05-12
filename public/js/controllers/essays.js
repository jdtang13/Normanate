var _ = require('lodash');

// front end AJAX controllers
module.exports = {
    createEssay: function(data, error) {
    // Create a piece, redirect to editing that piece
        $.ajax({
            url: '/essays',
            type: 'POST',
            cache: false,
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(essay) {
                window.location.replace('/essays/'+essay.id);
            },
            error: error
        });
    },

    updateEssay: function(data, error) {
        $.ajax({
            url: '/essays/'+window.essay.id,
            type: 'PUT',
            cache: false,
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(essay) {
                window.location.replace('/essays/'+essay.id);
            },
            error: error
        });
    },

    deleteEssay: function(data, success, error) {
        var extendedData = _.extend(data, {_method:'delete'});
        console.log(extendedData);
        $.ajax({
            url:'/essays/' + data.id,
            type: 'DELETE',
            data: extendedData,
            success: success,
            error: error
        });
    }
};