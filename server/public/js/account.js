const API_URL = "/api/v1/token/apply";


async function applyForToken() {
    const _result = await $.ajax({
        url: API_URL,
        type: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        success: (resp) => {
            console.log(`Successfully received a new token, id = ${resp.token}`);
            window.location.reload();
        },
        error: (e) => {
            console.log(`Couldn't apply for a new token: ${JSON.stringify(e)}`);
            showError(
                "Submission Error",
                `Couldn't apply for a new token: ${e.responseJSON?.error || 'No response from the server.'}`
            );
        }
    });
}

function toggleButton(btn, toggle) {
    $(btn).prop('disabled', toggle === 'off');
}

function makeRequestOnClick(btn, f) {
    toggleButton(btn, 'off');
    f().then(
        () => toggleButton(btn, 'on'),
        () => toggleButton(btn, 'on'),
    );
}

async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    $(".alert").removeClass("visually-hidden");
    setTimeout(() => {
        $(".alert").alert("close");
    }, 10000)
}


$(document).ready(() => {
    $("#btnApply").on("click", (_) => {
        makeRequestOnClick("#btnApply", applyForToken)
    });
});