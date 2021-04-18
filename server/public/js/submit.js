/// The API endpoint for submitting tickets.
const API_URL = "/api/v1/tickets/submit";
/// The API endpoint for retrieving ticket's information.
const POLL_URL = "/api/v1/tickets/info";
/// The frontend URL of the ticket info page.
const FRONT_TICKET_URL = "/ticket";
/// The number of milliseconds to pause before sending requests to the server during the polling phase.
const POLLING_INTERVAL = 250; // ms
/// The maximum number of characters that can be displayed in a similar ticket card.
/// ANything after this will be replaced with `...`.
const MAX_DESC_LENGTH_IN_TICKET_CARD = 350;
/// The settings to use when requesting predictions from the server.
let SETTINGS = {
    keywords: {
        method: "bert",
        parameters: {
            keyphrase_ngram_range: [1, 3],
            use_mmr: true,
            diversity: 0.7,
            // stop_words: [],
        }
    }
};
/// The map from (priority class) to (priority name).
const URGENCY_MAP = Object.freeze({
    "3": "Low",
    "2": "Medium",
    "1": "High",
    "0": "Critical"
});
/// The map from (priority name) to (priority theme).
const THEME_MAP = {
    "Critical": {
        "bg": "bg-danger",
        "fg": "text-white"
    },
    "High": {
        "bg": "bg-warning",
        "fg": "text-dark"
    },
    "Medium": {
        "bg": "bg-secondary",
        "fg": "text-white"
    },
    "Low": {
        "bg": "bg-success",
        "fg": "text-white"
    },
};
/// The names of all classes that may appear within a theme.
const ALL_CLASSES = "bg-danger bg-warning bg-secondary bg-success text-white text-dark";
/// A function that pauses the async function it is called in for the given number of milliseconds.
const sleep = m => new Promise(r => setTimeout(r, m))

/// Generate a similar ticket card for the given ticket.
function generateSimilarTicketCard(ticket, score, urgency) {
    const theme = THEME_MAP[urgency];
    const title = ticket.headline || "(Missing Title)";
    const description =
        ticket.description.length <= MAX_DESC_LENGTH_IN_TICKET_CARD ?
        ticket.description :
        ticket.description.substring(0, MAX_DESC_LENGTH_IN_TICKET_CARD) + " ...";

    return `<div class="card row-sm-5 row-md-5 col-lg-3" style="margin: 5px;">
    <h6 class="card-header ${theme.bg} ${theme.fg}">Ticket <span 
    style="text-decoration:underline;">${ticket.ticket_id} (${score}%)</span></h6>
    <div class="card-body">
        <h6 class="card-title text-center"><strong>${title}</strong></h6>
        <p class="card-text">${description}</p>
        <div class="row">
            <span class="badge ${theme.bg} ${theme.fg}" data-bs-toggle="tooltip" data-bs-placement="right" 
            title="Score: ${ticket.priority[1]?.toFixed(4)}">Priority: ${urgency}</span>
            <a href="${FRONT_TICKET_URL}/${ticket.ticket_id}" class="btn btn-primary" style="margin-top: 5px;" role="button">See Ticket</a>
        </div>
    </div>
</div>`;
}

/// Updates the UI using the given ticket data.
function updateUI(data) {
    toggleSpinner('off');

    // Set the ticket info
    $("#ticket-id").text(data.ticket_id);
    $("#headline").html(data.headline || "N/A");
    if (data.priority) {
        const urgency = URGENCY_MAP[data.priority[0]];
        const theme = THEME_MAP[urgency];
        const score = data.priority[1].toFixed(4);

        $("#ticket-header").removeClass(ALL_CLASSES).addClass(theme.bg).addClass(theme.fg);
        $("#priority")
            .removeClass(ALL_CLASSES)
            .addClass(theme.bg)
            .addClass(theme.fg)
            .attr("title", `Score: ${score}`)
            .html(`<strong>${urgency}</strong>`);
    } else {
        $("#priority").html("N/A");
    }
    if (data.category) {
        const category = data.category[0].replace(/(^|\s)\S/g, l => l.toUpperCase());
        const score = data.category[1].toFixed(4);
        $("#category")
            .attr("title", `Score: ${score}`)
            .html(`<strong>${category}</strong>`);
    } else {
        $("#category").html("N/A");
    }


    $("#similar").empty();
    for (const pair of data.similar) {
        const t = pair[0];
        const score = (100.0 * pair[1]).toFixed(0);
        const urgency = URGENCY_MAP[t.priority[0]];

        html = generateSimilarTicketCard(t, score, urgency)
        $("#similar").append(html);
    }


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
            html += `data-bs-toggle="tooltip" data-bs-placement="top" title="Score: ${score}">${kw}`
            html += i == arr.length - 1 ? "" : ", ";
            html += `</span>`;
            return html;
        }));

    // Wrap all keywords in <strong name="keyword-N" /> tags.
    let desc = data.description;
    for (const kw of Object.keys(kw2id)) {
        // Try to find the keyphrase as a full match first. This will not work if the keyphrase is composite
        // (i.e. the "key" words in the phrase do not follow one another immediately).
        const index = desc.toLowerCase().indexOf(kw);
        if (index !== -1) {
            const keyword = desc.substring(index, index + kw.length);
            const highlight = `<strong name="${kw2id[kw]}">${keyword}</strong>`;
            desc = desc.substring(0, index) + highlight + desc.substring(index + kw.length);
            continue;
        }


        // TODO: do something about same words preceding the keyword cluster
        // The if above has failed, meaning that this must be a composite keyphrase. 
        const words = kw.split(" ");
        let prev_index = 0;
        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const lower = desc.toLowerCase();
            let index = lower.indexOf(word, prev_index);

            // If this is the first word, look for the next word, and then try to search *backwards*
            // from the next word, for the first word.
            //
            // Consider the following text and the keyword list (brown, fox, jumps):
            //    0   1   2   3   4   5     6   7   8     9  10    11  12    13   14  15   16
            //   the red fox and the brown dog sit while the brown fox jumps over the lazy monkey
            //
            // If the take the first occurrence of brown, we'll get (brown, 5), (fox, 11), and (jumps, 12), 
            // which is not correct:
            //
            //    0   1   2   3   4   5     6   7   8     9  10    11  12    13   14  15   16
            //   the red fox and the brown dog sit while the brown fox jumps over the lazy monkey
            //                       -----                         --- -----
            //
            // However, if we apply the hack and search for the first occurrence of "fox" after the first occurrence of "brown" (5),
            // we'll get (fox, 11). If we now search backwards for "brown", we'll get (brown, 10) instead of (brown, 6), which is exactly what we want.
            //
            //    0   1   2   3   4   5     6   7   8     9  10    11  12    13   14  15   16
            //   the red fox and the brown dog sit while the brown fox jumps over the lazy monkey
            //                                               ----- --- -----
            //                                               ^-----<<< search backwards
            //
            // This hack relies on the chance that the second word doesn't occur more than once after the first word, or, in other words,
            // on the observation that the words in a keyphrase tend to be clustered together.
            if (i == 0 && words.length > 1 && index != -1) {
                const nextWord = lower.indexOf(words[i + 1], index);
                if (nextWord !== -1) index = lower.lastIndexOf(word, nextWord);
            }
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
            $("#ticketPageBtn").attr("href", `${FRONT_TICKET_URL}/${result.ticket_id}`)
            updateUI(result);
        } else {
            console.log(`[ERROR] Failed to process the ticket: ${JSON.stringify(result)}`);
            showError("Processing Error", `Failed to process the ticket. See logs for more info.`);
        }
        break;
    }
}

/// Submits the form to the server and keeps polling it until it receives a result.
/// Automatically updates the UI if the request succeeds.
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

/// "Toggles" the submit button
function toggleSubmitButton(toggle) {
    $("#btnSubmit").prop('disabled', toggle === 'off');
}

/// "Toggles" the spinner shown while making requests to the server.
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

/// Displays a bootstrap alert talking about successful registration for 10 seconds, then clears the navigation history.
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
        selector: '[data-bs-toggle=tooltip]'
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