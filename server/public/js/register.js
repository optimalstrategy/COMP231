const API_URL = "/api/v1/users/register";

function highlight(e, isOk) {
    if (isOk) {
        e.addClass("border-success");
        e.removeClass("border-danger");
        e.get(0).setCustomValidity("");
    } else {
        e.addClass("border border-danger");
        e.removeClass("border-success");
    }
}

function validate(json) {
    for (const field of Object.keys(json)) {
        const e = $(`#${field}`);
        highlight(e, e.get(0).checkValidity());
    }


    const e = $("#confirmation");
    if (json.password !== json.confirmation || !json.confirmation) {
        e.get(0).setCustomValidity("Passwords don't match");
        highlight(e, false);
    } else {
        highlight(e, true);
    }
}

async function signup(form) {
    const json = {};
    form.serializeArray().forEach((field) => {
        json[field.name] = field.value;
    });


    validate(json);
    if (!form.get(0).reportValidity()) {
        return;
    }

    const result = await $.ajax({
        url: API_URL,
        type: "POST",
        data: JSON.stringify(json),
        headers: {
            "Content-Type": "application/json"
        },
        success: (resp) => {
            console.log(`Successfully registered: `, JSON.stringify(resp));
        },
        error: (e) => {
            console.log(`Couldn't complete registration: ${JSON.stringify(e)}`);
            showError(
                "Submission Error",
                `Couldn't complete registration: ${e.responseJSON?.error || 'No response from the server.'}`
            );
        }
    });

    if ("id" in result) {
        window.location.replace("/submit?signup=1");
    }
}

function toggleSubmitButton(toggle) {
    $("#btnSubmit").prop('disabled', toggle === 'off');
}


$(document).ready(() => {
    $("#btnSubmit").on("click", (_) => {
        toggleSubmitButton('off');
        signup($('#signup-form')).then(
            () => toggleSubmitButton('on'),
            () => toggleSubmitButton('on'),
        );
    });
});