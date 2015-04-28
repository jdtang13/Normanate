var loadModal = '<div class="modal fade" id="loadingModal" tabindex="-1" role="dialog" aria-hidden="true">'+
  '<div class="modal-dialog">' +
    '<div class="modal-content">' +
      '<div class="modal-header">' +
        '<h4 class="modal-title">Processing...</h4>' +
      '</div>' + 
      '<div class="modal-body">' +
        '<div class="loader">Loading...</div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '</div>' +
   '</div>' +
  '</div>' +
'</div>';

$('body').append($(loadModal));

module.exports = {
    load: function() {
        console.log('Hello');
        $('#loadingModal').modal();
    }
};