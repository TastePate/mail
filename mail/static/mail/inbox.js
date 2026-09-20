document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('#inbox').addEventListener('click',
        () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click',
        () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click',
        () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click',
        () => load_mailbox('compose'));

    document.querySelector('.nav').addEventListener("mouseenter", () => {
        document.querySelectorAll('.nav-elements > *').forEach(span => {
            span.classList.toggle('open');
        });
    });

    document.querySelector('.nav').addEventListener("mouseleave", () => {
        document.querySelectorAll('.nav-elements > *').forEach(span => {
            span.classList.toggle('open');
        });
    });

    setup_menu_triangles();
    write_greeting_words();
    setup_mailbox_progress();
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

    document.querySelector('.header > h3').textContent = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);

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


    document.querySelector('.mailbox').replaceChildren(clone);
}

function render_email(email, mailbox) {
    const email_div = document.createElement('div');
    email_div.className = 'mailbox-element';

    if (email.read) {
        email_div.classList.add('read');
    }

    email_div.addEventListener('click', event => {
       event.preventDefault();
       render_email_page(email, mailbox==='sent');
    });

    email_div.insertAdjacentHTML('beforeend', `<span class="mail-sender">${email.sender}</span>`);
    email_div.insertAdjacentHTML('beforeend', `<span class="mail-subject">${email.subject}</span>`);
    email_div.insertAdjacentHTML('beforeend', `<small class="mail-timestamp">${email.timestamp}</small>`);

    return email_div;
}

function render_email_page(email, is_from_sent=false) {
    const template = document.querySelector('#email-page-template');
    const clone = template.content.cloneNode(true);

    document.querySelector('.header > h3').textContent = 'Mail';

    clone.querySelector('.email-subject').textContent = email.subject;
    clone.querySelector('.email-sender').textContent = email.sender;
    clone.querySelector('.email-time').textContent = email.timestamp;

    email.recipients.forEach(recipient => {
        const span = document.createElement('span');
        span.textContent = recipient;

        clone.querySelector('.email-recipients').append(span);
    });

    clone.querySelector('.email-text').textContent = email.body;

    if (!is_from_sent) {
        clone.querySelector('#archive-link').append(create_archive_link(email));
    }

    clone.querySelector('#reply-link').onclick = (event) => {
        event.preventDefault();
        const subject = !email.subject.startsWith('Re:') ? 'Re: ' + email.subject : email.subject;
        const body = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
        load_compose(email.sender, subject, body);
    }

    document.querySelector('.mailbox').replaceChildren(clone);
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

    document.querySelector('.header > h3').textContent = 'Compose';

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

    document.querySelector('.mailbox').replaceChildren(clone);
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

function setup_menu_triangles() {
    document.querySelectorAll('.nav-elements > span').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const rotation = Math.random() * 2 * Math.PI;
            const points = [0, 1, 2].map(index => {
                const angle = rotation + index * 2 * Math.PI / 3
                    + (Math.random() - 0.5) * Math.PI / 9;
                const radius = 34 + Math.random() * 14;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
            });

            item.style.setProperty('--triangle-points', points.join(', '));
        });
    });
}

function setup_mailbox_progress() {
    const mailbox = document.querySelector('.mailbox');
    const progress = document.querySelector('.mailbox-progress');

    if (!mailbox || !progress) return;

    const fill = progress.querySelector('.mailbox-progress-fill');

    if (!fill) return;

    function update_progress() {
        const max_scroll =
            mailbox.scrollHeight - mailbox.clientHeight;

        const has_overflow = max_scroll > 1;

        progress.hidden = !has_overflow;

        const fraction = has_overflow
            ? Math.min(
                1,
                Math.max(0, mailbox.scrollTop / max_scroll)
            )
            : 0;

        fill.style.transform = `scaleX(${fraction})`;

        progress.setAttribute(
            'aria-valuenow',
            Math.round(fraction * 100)
        );
    }

    mailbox.addEventListener('scroll', update_progress, {
        passive: true
    });

    window.addEventListener('resize', update_progress);

    const mutation_observer = new MutationObserver(() => {
        requestAnimationFrame(update_progress);
    });

    mutation_observer.observe(mailbox, {
        childList: true,
        subtree: true
    });

    const resize_observer = new ResizeObserver(update_progress);
    resize_observer.observe(mailbox);

    update_progress();
}

function write_greeting_words() {
    const output = document.querySelector('.have-a-nice.object');
    if (!output) return;

    const words = ['day!', 'night!', 'work!'];
    let wordIndex = 0;
    let letters = 0;
    let deleting = false;

    function type() {
        const word = words[wordIndex];
        output.textContent = word.slice(0, letters);

        let delay;

        if (!deleting && letters < word.length) {
            letters++;
            delay = 120;
        } else if (!deleting) {
            deleting = true;
            delay = 1500;
        } else if (letters > 0) {
            letters--;
            delay = 70;
        } else {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 250;
        }

        setTimeout(type, delay);
    }

    type();
}


