$('.move-up span').click(function () {
    $('html,body').animate({
        scrollTop: 0
    }, 1000);
});

/// Shows the error modal with the given title and message.
function showError(title, message) {
    $("#error-title").text(title);
    $("#error-message").text(message);
    $("#error-modal").modal('show');
}