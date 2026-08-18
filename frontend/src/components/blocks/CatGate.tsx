'use client';

/**
 * THE CAT PASSWORD GATE.
 *
 * The Children's Apperception Test depends on children not having seen the
 * cards before, so the researcher asked for the full set to stay unpublished.
 *
 * What changed from the original build: the password is no longer compared in
 * the browser. It is posted to the backend, which holds it in an environment
 * variable and compares it in constant time behind a rate limit. That takes
 * the password out of the JavaScript bundle, where "view source" used to find
 * it in about ten seconds.
 *
 * What has NOT changed, and the copy below must keep saying: the artwork is
 * still static files at predictable URLs. This is a deterrent. BUILD_SPEC §10
 * forbids claiming otherwise, and the sentence in the markup is that promise
 * kept.
 */

import { useState, type FormEvent } from 'react';
import { Plate } from './Plate';
import { verifyCatGate } from '@/lib/api';
import type { Gate } from '@/content/types';

interface CatGateProps {
  gate: Gate;
  mat?: boolean;
}

type Status = 'idle' | 'checking' | 'denied' | 'unlocked' | 'error';

export function CatGate({ gate, mat = false }: CatGateProps) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'checking') return;

    setStatus('checking');
    setMessage('');

    const result = await verifyCatGate(password);

    if (result.ok) {
      setStatus('unlocked');
      setMessage(result.message);
      return;
    }

    // A wrong password and an unreachable server are different failures and a
    // visitor deserves to be told which one happened — otherwise they retype a
    // correct password five times at an offline API.
    setStatus(result.code === 'GATE_DENIED' ? 'denied' : 'error');
    setMessage(result.message);
  }

  return (
    <>
      <div className="plates">
        {gate.preview.map((item) => (
          <Plate key={item.src} item={item} marked mat={mat} />
        ))}
      </div>

      {status === 'unlocked' ? (
        <>
          <p className="gate__msg" role="status">
            {message}
          </p>
          <div className="plates">
            {gate.full.map((item) => (
              <Plate key={item.src} item={item} mat={mat} />
            ))}
          </div>
        </>
      ) : (
        <div className="gate">
          <p style={{ margin: 0 }}>
            The full set is password-protected at the researcher’s request. This is a deterrent held
            in the page, not security — anyone determined can read past it. Ask and I will send the
            set.
          </p>
          <form className="gate__form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="cat-password">
              Password for the full CAT set
            </label>
            <input
              id="cat-password"
              className="gate__input"
              type="password"
              placeholder="PASSWORD"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={status === 'checking'}
              aria-invalid={status === 'denied'}
              aria-describedby="cat-gate-msg"
            />
            <button className="gate__go" type="submit" disabled={status === 'checking' || !password}>
              {status === 'checking' ? 'CHECKING…' : 'UNLOCK'}
            </button>
          </form>
          <p className="gate__msg" id="cat-gate-msg" role="status">
            {message}
          </p>
        </div>
      )}
    </>
  );
}
