$('.move-up span').click(function () {
    $('html,body').animate({
        scrollTop: 0
    }, 1000);
});

function showError(title, message) {
    $("#error-title").text(title);
    $("#error-message").text(message);
    $("#error-modal").modal('show');
}