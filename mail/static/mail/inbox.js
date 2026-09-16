document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('#inbox').addEventListener('click',
        () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click',
        () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click',
        () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click',
        () => load_mailbox('compose'));

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
    document.querySelector('#emails-view').innerHTML =
        `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    switch (mailbox) {
        case 'inbox':
            inbox();
            break;
        case 'sent':
            switchComposeEmailsView('emails');
            break;
        case 'archived':
            switchComposeEmailsView('emails');
            break;
        case 'compose':
            compose();
            break;
        default:
            break;
    }
}

function inbox() {
    switchComposeEmailsView('emails');
    fetch('/emails/inbox')
        .then(response => response.json())
        .then(emails => {
            const inbox_div = document.createElement('div');
            if (emails.length === 0) {
                inbox_div.innerHTML = 'No emails!'
            } else {
                emails.forEach((email_content) => {
                    const email_div = document.createElement('div');
                    email_div.innerHTML = email_content.body;
                    inbox_div.append(email_div);
                });
            }
            document.querySelector('#emails-view').append(inbox_div);
        });
}

function compose() {
    switchComposeEmailsView('compose');
    document.querySelector('#compose-form').onsubmit = function (event) {
        event.preventDefault();

        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value,
            })
        })
            .then(response => response.json())
            .then(result => console.log(result));
    };
}


function switchComposeEmailsView(mode) {
    if (mode === 'emails') {
        document.querySelector('#emails-view').style.display = 'block';
        document.querySelector('#compose-view').style.display = 'none';
    } else if (mode === 'compose') {
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
    }
}