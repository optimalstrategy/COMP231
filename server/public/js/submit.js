const API_URL = "/api/v1/tickets/submit";
const POLL_URL = "/api/v1/tickets/info"
const POLLING_INTERVAL = 250; // ms
let SETTINGS = {
    keywords: {
        method: "bert",
        parameters: {
            keyphrase_ngram_range: [1, 3],
            use_mmr: true,
            diversity: 0.7,
            stop_words: [],
        }
    }
};
const sleep = m => new Promise(r => setTimeout(r, m))

function updateUI(data) {
    toggleSpinner('off');

    // Set the ticket id and hadline
    $("#ticket-id").text(data.ticket_id);
    $("#headline").html(data.headline || "N/A");
    $("#priority").html(data.priority || "N/A");
    $("#category").html(data.category || "N/A");

    // Wrap the keywords in <spans> with tooltips that display their scores
    const kw2id = {};
    $("#keywords").html(
        data.keywords
        .sort((a, b) => a[1] - b[1])
        .map((data, i, arr) => {
            const kw = data[0];
            const score = data[1];
            const id = `keyword-${i}`;
            kw2id[kw] = id;

            let html = `<span class="keyword" id="${id}"`
            html += `data-toggle="tooltip" data-placement="top" title="Score: ${score}">${kw}`
            html += i == arr.length - 1 ? "" : ", ";
            html += `</span>`;
            return html;
        }));

    // Wrap all keywords in <strong name="keyword-N" /> tags.
    let desc = data.description;
    for (const kw of Object.keys(kw2id)) {
        // Since keywords can be composite, we need to wrap each word individually
        const words = kw.split(" ");

        // TODO: do something about same words preceding the keyword cluster
        let prev_index = 0;
        for (const word of words) {
            let index = desc.toLowerCase().indexOf(word, prev_index);
            if (index === -1) continue;

            const keyword = desc.substring(index, index + word.length);
            const highlight = `<strong name="${kw2id[kw]}">${keyword}</strong>`;
            desc = desc.substring(0, index) + highlight + desc.substring(index + word.length);

            prev_index = index + highlight.length;
        }
    }
    $("#description").html(desc);

    // Setup the hover callbacks
    for (const id of Object.values(kw2id)) {
        const words = $(`[name='${id}']`);
        for (const word of words) {
            const selector = `#${id}`;
            hoverKeywordGroup(selector, word, words);
            hoverKeywordGroup(selector, selector, words);
        }
    }
}

/// Sets up a hover callback that highlights all words in the group and the corresponding keyword entry.
function hoverKeywordGroup(id, trigger, words) {
    $(trigger).hover(
        () => forEach(words, w => {
            $(w).addClass('highlight');
            $(id).addClass('highlight');
        }),
        () => forEach(words, w => {
            $(w).removeClass('highlight');
            $(id).removeClass('highlight');
        }),
    );
}

/// A forEach polyfill for jquery arrays.
function forEach(o, f) {
    for (const e of o) f(e);
}

/// Polls the server every `POLLING_INTERVAL` ms for processing results.
/// Updates the UI on success.
async function poll(id) {
    const URL = `${POLL_URL}/${id}`;
    while (true) {
        const result = await $.ajax({
            url: URL,
            type: "GET",
            success: (data) => {
                console.log("[INFO] Received a response after the poll:", data);
            },
            error: (e) => {
                console.log("[ERROR] Failed to retrieve the ticket info:", e);
                showError("Server Error", `Failed to retrieve the ticket info: ${JSON.stringify(e)}`);
            }
        });

        if ("error" in result) {
            break;
        }

        if (result.status == "processing") {
            console.log(
                `[INFO ] The ticket is still being processed. Waiting ${POLLING_INTERVAL}ms before the next poll.`
            );
            await sleep(POLLING_INTERVAL);
            continue;
        }

        if (result.status == "processed") {
            console.log(`[INFO] The ticket has been processed successfully; updating the UI.`);
            updateUI(result);
        } else {
            console.log(`[ERROR] Failed to process the ticket: ${JSON.stringify(result)}`);
            showError("Processing Error", `Failed to process the ticket. See logs for more info.`);
        }
        break;
    }
}

async function submit(form) {
    const json = {};
    form.serializeArray().forEach((field) => {
        json[field.name] = field.value;
    });
    json.settings = SETTINGS;

    const result = await $.ajax({
        url: API_URL,
        type: "POST",
        data: JSON.stringify(json),
        headers: {
            "Content-Type": "application/json"
        },
        success: (resp) => {
            console.log(`Successfully submitted the ticket, id = ${resp.ticket_id}`);
        },
        error: (e) => {
            console.log(`Couldn't submit the ticket: ${JSON.stringify(e)}`);
            showError(
                "Submission Error",
                `Couldn't submit the ticket: ${e.responseJSON?.error || 'No response from the server.'}`
            );
        }
    });

    if ("ticket_id" in result) {
        await poll(result.ticket_id);
    } else {
        // The error messages should've been displayed in the (error) handler.
    }
}

function toggleSubmitButton(toggle) {
    $("#btnSubmit").prop('disabled', toggle === 'off');
}

function toggleSpinner(toggle) {
    const spinner = $("#spinner");
    const ticket = $("#ticket-view");
    if (toggle === 'on') {
        spinner.removeClass("visually-hidden");
        ticket.addClass("visually-hidden");
    } else if (toggle == 'off') {
        spinner.addClass("visually-hidden");
        ticket.removeClass("visually-hidden");
    } else {
        spinner.addClass("visually-hidden");
        ticket.addClass("visually-hidden");
    }
}

function onSignupRedirect() {
    // Display an alert stating that the registration was successful.
    $("main").prepend(`<div class="alert alert-success alert-dismissible fade show" role="alert">
    <strong>Successfully registered!</strong> Use the form bellow to submit a ticket for processing.
    <button type="button" class="btn-close close" data-dismiss="alert" aria-label="Close"
        onclick="$('.alert').alert('close')">
    </button>
</div>`);
    // Close the alert after 10 seconds.
    setTimeout((_) => {
        $('.alert').alert("close");
    }, 10000);

    // Remove the signup parameter from the URL so refreshing the page
    // doesn't trigger the alert again.
    window.history.replaceState(null, null, window.location.pathname);
}

$(document).ready(() => {
    if ((new URLSearchParams(window.location.search).get("signup") === '1')) {
        onSignupRedirect();
    }
    $("body").tooltip({
        selector: '[data-toggle=tooltip]'
    });
    $("#btnSubmit").on("click", (_) => {
        toggleSubmitButton('off');
        toggleSpinner('on');
        submit($('#ticketForm')).then(
            () => toggleSubmitButton('on'),
            (e) => {
                toggleSpinner('both');
                toggleSubmitButton('on');
                throw e;
            }
        );
    });
});