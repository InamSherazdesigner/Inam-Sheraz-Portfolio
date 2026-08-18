'use client';

/**
 * THE CONTACT FORM.
 *
 * New in this build. The original contact channel was links only, and every
 * link is still an unfilled placeholder — which meant the site shipped with no
 * working way to reach anyone. This form closes that gap without waiting on
 * the details, because it posts to the backend rather than to an inbox.
 *
 * Validation runs in both places for different reasons: here so a visitor is
 * told immediately and does not lose what they typed to a round trip, and on
 * the server because client-side validation is a courtesy and never a control.
 */

import { useId, useState, type FormEvent } from 'react';
import { sendContactMessage } from '@/lib/api';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface FieldErrors {
  name?: string;
  email?: string;
  body?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm() {
  const id = useId();
  const [values, setValues] = useState({ name: '', email: '', subject: '', body: '', website: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = 'Please add your name.';
    if (!EMAIL.test(values.email.trim())) next.email = 'That does not look like an email address.';
    if (values.body.trim().length < 10) next.body = 'Please write a little more than that.';
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus('error');
      setMessage('');
      return;
    }

    setStatus('sending');
    setMessage('');

    const result = await sendContactMessage({
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      body: values.body.trim(),
      website: values.website,
    });

    if (result.ok) {
      setStatus('sent');
      setMessage(result.message);
      setValues({ name: '', email: '', subject: '', body: '', website: '' });
      return;
    }

    setStatus('error');
    // The server may disagree with the client about a field. Its answer wins
    // and is shown against the field it names.
    if (result.details?.length) {
      const serverErrors: FieldErrors = {};
      for (const detail of result.details) {
        if (detail.field === 'name' || detail.field === 'email' || detail.field === 'body') {
          serverErrors[detail.field] = detail.message;
        }
      }
      setErrors(serverErrors);
    }
    setMessage(result.message);
  }

  if (status === 'sent') {
    return (
      <div className="form">
        <p className="form__msg" role="status">
          {message}
        </p>
        <button type="button" className="form__go" onClick={() => setStatus('idle')}>
          SEND ANOTHER
        </button>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form__row">
        <label className="form__label" htmlFor={`${id}-name`}>
          NAME
        </label>
        <input
          id={`${id}-name`}
          className="form__input"
          value={values.name}
          onChange={set('name')}
          autoComplete="name"
          disabled={sending}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={`${id}-name-error`}
        />
        <span className="form__error" id={`${id}-name-error`}>
          {errors.name}
        </span>
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor={`${id}-email`}>
          EMAIL
        </label>
        <input
          id={`${id}-email`}
          className="form__input"
          type="email"
          inputMode="email"
          value={values.email}
          onChange={set('email')}
          autoComplete="email"
          disabled={sending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={`${id}-email-error`}
        />
        <span className="form__error" id={`${id}-email-error`}>
          {errors.email}
        </span>
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor={`${id}-subject`}>
          {/* No dimming here. The label already sits at --ink-75, and an extra
              0.6 on top took it to 2.51:1 — below AA on the amber ground. */}
          SUBJECT — OPTIONAL
        </label>
        <input
          id={`${id}-subject`}
          className="form__input"
          value={values.subject}
          onChange={set('subject')}
          disabled={sending}
        />
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor={`${id}-body`}>
          MESSAGE
        </label>
        <textarea
          id={`${id}-body`}
          className="form__area"
          value={values.body}
          onChange={set('body')}
          disabled={sending}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={`${id}-body-error`}
        />
        <span className="form__error" id={`${id}-body-error`}>
          {errors.body}
        </span>
      </div>

      {/* Honeypot. Off-screen, hidden from assistive technology, out of the
          tab order. A human never sees it; a bot that fills every input does. */}
      <div className="form__pot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input
          id={`${id}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <button className="form__go" type="submit" disabled={sending}>
        {sending ? 'SENDING…' : 'SEND'}
      </button>

      <p
        className={status === 'error' ? 'form__msg form__msg--error' : 'form__msg'}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
