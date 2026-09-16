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
        emails(mailbox);
    }
}

function emails(mailbox) {
    switchComposeEmailsView('emails');
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            const inbox_div = document.createElement('div');
            if (emails.length === 0) {
                inbox_div.innerHTML = 'No emails!'
            } else {
                emails
                    .toSorted((el1, el2) => {
                        const date1 = Date.parse(el1.timestamp.replace(' ', 'T').slice(0, 19));
                        const date2 = Date.parse(el2.timestamp.replace(' ', 'T').slice(0, 19));

                        if (el1.read === el2.read) {
                            if (date1 === date2) {
                                return 0;
                            } else {
                                if (date1 > date2) {
                                    return -1;
                                } else {
                                    return 1;
                                }
                            }
                        } else {
                            if (el2.read) {
                                return -1;
                            } else {
                                return 1;
                            }
                        }
                    })
                    .forEach((email_content) => {
                        const email_div = document.createElement('div');
                        email_div.style.border = "2px solid black";
                        email_div.style.display = 'flex';
                        email_div.style.flexDirection = 'column';

                        const link = document.createElement('a');
                        link.textContent = email_content.body;
                        link.href = '#';
                        link.addEventListener('click', event => {
                           event.preventDefault();
                           show_email(email_content);
                        });

                        const archive_link = document.createElement('a');
                        archive_link.href = '#';
                        archive_link.textContent = email_content.archived ? 'Remove from archive' : "Archive";
                        archive_link.addEventListener('click', event => {
                            event.preventDefault();
                            fetch(`/emails/${email_content.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    'archived': !email_content.archived,
                                })
                            }).then(() => {
                                load_mailbox(mailbox);
                            });
                        });



                        email_div.append(link);
                        email_div.insertAdjacentHTML('beforeend', `<span>${email_content.sender}</span>`);
                        email_div.insertAdjacentHTML('beforeend', `<span>${email_content.timestamp}</span>`);
                        let read = email_content.read ? "Read" : "Didn't read";

                        email_div.insertAdjacentHTML('beforeend', `<span>${read}</span>`);

                        if (mailbox !== 'sent') {
                            email_div.append(archive_link);
                        }

                        inbox_div.append(email_div);
                });
            }
            document.querySelector('#emails-view').append(inbox_div);
        });
}

function compose(recipient='', subject='', body='') {
    switchComposeEmailsView('compose');
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
            .then(response => response.json())
            .then(result => {
                console.log(result);
                load_mailbox('compose');
            });
    };
}

function show_email(email) {
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
        </div>
    `;

    document.querySelector('#reply-link').onclick = () => {
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

function switchComposeEmailsView(mode) {
    if (mode === 'emails') {
        document.querySelector('#emails-view').style.display = 'block';
        document.querySelector('#compose-view').style.display = 'none';
    } else if (mode === 'compose') {
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
    }
}


