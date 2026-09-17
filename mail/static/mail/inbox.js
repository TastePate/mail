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
    document.querySelector('#emails-view').innerHTML =
        `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    if (mailbox === 'compose') {
        compose();
    } else {
        load_emails(mailbox);
    }
}

function get_emails(mailbox) {
    return fetch(`/emails/${mailbox}`)
        .then(response => response.json());
}

function load_emails(mailbox) {
    get_emails(mailbox)
        .then(emails => render_emails(mailbox, emails))
}

function render_emails(mailbox, emails) {
    const inbox_div = document.createElement('div');

    if (emails.length === 0) {
        inbox_div.innerHTML = 'No emails!'
    } else {
        emails.forEach((email) => {
            const render = render_email(email, mailbox);
            inbox_div.append(render);
        });
    }

    document.querySelector('#emails-view').append(inbox_div);
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


function compose(recipient='', subject='', body='') {
    switch_view('compose');
    document.querySelector('#compose-recipients').value = recipient;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;

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
            .then(response => {
                return response.json().then(data => {
                    return {
                        ok: response.ok,
                        data: data
                    }
                })
            })
            .then(result => {
                if (!result.ok) {
                    alert(result.data.error);
                } else {
                    load_mailbox('sent');
                }
            });
    };
}

function render_email_page(email, is_from_sent=false) {
    let recipients = '';
    email.recipients.forEach((recipient) => {
        recipients += `<span>${recipient}</span>`
    });

    document.querySelector('#emails-view').innerHTML = `
        <div class="email-card" data-id="${email.id}">
            <div class="email-header">
                <span class="email-sender">Sender: ${email.sender}</span>
                <span class="email-time">Time: ${email.timestamp}</span>
            </div>
            
            <div class="email-recipients">
                <span>Recipients:</span>
                ${recipients}
            </div>
            
            <div class="email-subject">
                <span>Subject:</span>
                ${email.subject}
            </div>
            
            <div class="email-body">
                <span>Body:</span>
                ${email.body}
            </div>
            
            <div class="email-reply">
                <span><a href="#" id="reply-link">Reply</a></span>
            </div> 
            
            <div id="archive-link"></div>
        </div>
    `;
    
    if (!is_from_sent) {
        document.querySelector('#archive-link').append(create_archive_link(email));
    }

    document.querySelector('#reply-link').onclick = (event) => {
        event.preventDefault();
        const subject = !email.subject.startsWith('Re:') ? 'Re: ' + email.subject : email.subject;
        const body = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
        compose(email.sender, subject, body);
    }

    fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

function switch_view(mode) {
    if (mode === 'emails') {
        document.querySelector('#emails-view').style.display = 'block';
        document.querySelector('#compose-view').style.display = 'none';
    } else if (mode === 'compose') {
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
    }
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

