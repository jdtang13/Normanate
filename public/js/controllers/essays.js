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
                console.log(essay);
                window.location.replace('/essays/'+essay.id);
            },
            error: error
        });
    }
};