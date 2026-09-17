document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('#inbox').addEventListener('click',
        () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click',
        () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click',
        () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click',
        () => load_mailbox('compose'));

    load_mailbox('inbox');
});

function load_mailbox(mailbox) {
    if (mailbox === 'compose') {
        load_compose();
    } else {
        load_emails(mailbox);
    }
}

/*
* Block for emails view. API, DOM, redner and so on
*/

function get_emails(mailbox) {
    return fetch(`/emails/${mailbox}`)
        .then(response => response.json());
}

function load_emails(mailbox) {
    get_emails(mailbox)
        .then(emails => render_emails(mailbox, emails))
}

function render_emails(mailbox, emails) {
    const template = document.querySelector('#mailbox-template')
    const clone = template.content.cloneNode(true);

    clone.querySelector('.page-header').textContent = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);

    if (emails.length === 0) {
        const span = document.createElement('span');
        span.textContent = 'No emails!';

        clone.append(span);
    } else {
        emails.forEach((email) => {
            const render = render_email(email, mailbox);
            clone.append(render);
        });
    }

    document.querySelector('#app-view').replaceChildren(clone);
}

function render_email(email, mailbox) {
    const email_div = document.createElement('div');

    const link = document.createElement('a');
    link.textContent = email.subject;
    link.href = '#';
    link.addEventListener('click', event => {
       event.preventDefault();
       render_email_page(email, mailbox==='sent');
    });

    const archive_link = create_archive_link(email);

    email_div.append(link);
    email_div.insertAdjacentHTML('beforeend', `<span>${email.sender}</span>`);
    email_div.insertAdjacentHTML('beforeend', `<span>${email.timestamp}</span>`);
    const read = email.read ? "Read" : "Didn't read";

    email_div.insertAdjacentHTML('beforeend', `<span>${read}</span>`);

    if (mailbox !== 'sent') {
        email_div.append(archive_link);
    }

    return email_div;
}

function render_email_page(email, is_from_sent=false) {
    const template = document.querySelector('#email-page-template');
    const clone = template.content.cloneNode(true);

    clone.querySelector('.email-subject').textContent = email.subject;
    clone.querySelector('.email-sender').textContent = email.sender;
    clone.querySelector('.email-time').textContent = email.timestamp;

    email.recipients.forEach(recipient => {
        const span = document.createElement('span');
        span.textContent = recipient;

        clone.querySelector('.email-recipients').append(span);
    });

    clone.querySelector('.email-body').textContent = email.body;

    if (!is_from_sent) {
        clone.querySelector('#archive-link').append(create_archive_link(email));
    }

    clone.querySelector('#reply-link').onclick = (event) => {
        event.preventDefault();
        const subject = !email.subject.startsWith('Re:') ? 'Re: ' + email.subject : email.subject;
        const body = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
        load_compose(email.sender, subject, body);
    }

    document.querySelector('#app-view').replaceChildren(clone);
    set_email_as_read(email.id);
}

function set_email_as_read(email_id) {
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

/*
* Block for compose view. API, DOM, redner and so on
*/

function load_compose(recipient='', subject='', body='') {
    const template = document.querySelector('#compose-template');
    const clone = template.content.cloneNode(true);

    clone.querySelector('#compose-recipients').value = recipient;
    clone.querySelector('#compose-subject').value = subject;
    clone.querySelector('#compose-body').value = body;

    clone.querySelector('#compose-form').onsubmit = function (event) {
        event.preventDefault();
        const response = send_email(clone.querySelector('#compose-recipients').value,
                            clone.querySelector('#compose-subject').value,
                            clone.querySelector('#compose-body').value);
        response.then(result => {
            if (result.ok) {
                load_mailbox('sent');
            } else {
                alert(result.data.error);
            }
        });
    };

    document.querySelector('#app-view').replaceChildren(clone);
}

function send_email(recipient, subject, body) {
    return fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipient,
                subject: subject,
                body: body,
            })
        }).then(response => {
            return response.json().then(data => {
                return {
                    ok: response.ok,
                    data: data
                }
            })
        });
}

function create_archive_link(email_content) {
    const archive_link = document.createElement('a');
    archive_link.href = '#';
    archive_link.textContent = email_content.archived ? 'Unarchive' : "Archive";
    archive_link.addEventListener('click', event => {
        event.preventDefault();
        fetch(`/emails/${email_content.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                'archived': !email_content.archived,
            })
        }).then(() => {
            load_mailbox('inbox');
        });
    });

    return archive_link;
}

