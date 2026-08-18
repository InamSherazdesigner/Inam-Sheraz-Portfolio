/**
 * THE VOICE AGENT WIDGET.
 *
 * The behaviour under test is the half of the key-hiding design that lives in
 * the browser: this component must never hold, request or transmit a
 * credential, and it must ask for the microphone before it asks for a session
 * so a denied permission does not burn a billable one.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceAgent } from '@/components/voice/VoiceAgent';

const startSession = vi.fn();

vi.mock('@elevenlabs/client', () => ({
  Conversation: {
    startSession: (...args: unknown[]) => startSession(...args),
  },
}));

const requestVoiceSession = vi.fn();
vi.mock('@/lib/api', () => ({
  requestVoiceSession: () => requestVoiceSession(),
}));

const track = { stop: vi.fn() };
const grantMicrophone = () =>
  vi.fn().mockResolvedValue({ getTracks: () => [track] } as unknown as MediaStream);
const denyMicrophone = () => vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));

function withMediaDevices(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value: { getUserMedia },
  });
}

const goodSession = {
  ok: true as const,
  session: {
    provider: 'elevenlabs' as const,
    transport: 'websocket' as const,
    signedUrl: 'wss://api.elevenlabs.io/v1/convai/conversation?token=short-lived',
    agentId: 'agent_test',
    expiresAt: new Date(Date.now() + 45_000).toISOString(),
    expiresInSeconds: 45,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  withMediaDevices(grantMicrophone());
  requestVoiceSession.mockResolvedValue(goodSession);
  startSession.mockResolvedValue({ endSession: vi.fn().mockResolvedValue(undefined) });
});

afterEach(() => {
  // @ts-expect-error — removing the stub between tests
  delete navigator.mediaDevices;
});

describe('starting a session', () => {
  it('opens the socket with a signed URL and never a key', async () => {
    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);

    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));

    const options = startSession.mock.calls[0]![0] as Record<string, unknown>;
    expect(options.signedUrl).toBe(goodSession.session.signedUrl);

    // The properties that would carry a credential do not exist. This is the
    // assertion the whole backend exists to make true.
    expect(options).not.toHaveProperty('apiKey');
    expect(options).not.toHaveProperty('xiApiKey');
    expect(JSON.stringify(Object.keys(options))).not.toMatch(/key/i);
  });

  it('asks for the microphone before it asks for a session', async () => {
    const order: string[] = [];
    const getUserMedia = vi.fn().mockImplementation(async () => {
      order.push('microphone');
      return { getTracks: () => [track] };
    });
    withMediaDevices(getUserMedia);
    requestVoiceSession.mockImplementation(async () => {
      order.push('session');
      return goodSession;
    });

    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() => expect(order).toHaveLength(2));
    // The other order burns a billable session every time somebody presses
    // the button and then denies the microphone.
    expect(order).toEqual(['microphone', 'session']);
  });

  it('releases the permission-prompt stream — the SDK opens its own', async () => {
    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() => expect(track.stop).toHaveBeenCalled());
  });
});

describe('when things go wrong', () => {
  it('never requests a session if the microphone is denied', async () => {
    withMediaDevices(denyMicrophone());

    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/microphone was blocked/i)
    );
    expect(requestVoiceSession).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it('shows the server’s message when a session is refused', async () => {
    requestVoiceSession.mockResolvedValue({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'You have started several voice sessions already. Please wait a few minutes.',
    });

    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/several voice sessions already/i)
    );
    expect(startSession).not.toHaveBeenCalled();
  });

  it('says so plainly when the backend is in mock mode', async () => {
    requestVoiceSession.mockResolvedValue({
      ok: true,
      session: { ...goodSession.session, provider: 'mock', mock: true },
    });

    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/mock mode/i));
    // A developer setup, not a deployment fault — and worth distinguishing.
    expect(screen.getByRole('status')).toHaveTextContent(/VOICE_PROVIDER=elevenlabs/);
  });

  it('offers the screen recording when the browser has no microphone API', async () => {
    // @ts-expect-error — simulating an insecure origin or an old browser
    delete navigator.mediaDevices;

    render(<VoiceAgent label="Talk to the agent" />);

    expect(screen.getByText(/cannot open a microphone/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /START TALKING/i })).not.toBeInTheDocument();
  });

  it('keeps upstream error detail out of the visible message', async () => {
    startSession.mockRejectedValue(
      new Error('WebSocket failed: 401 xi-api-key invalid at /srv/app/node_modules/ws')
    );

    const user = userEvent.setup();
    render(<VoiceAgent label="Talk to the agent" />);
    await user.click(screen.getByRole('button', { name: /START TALKING/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Could not start/i));
    const shown = screen.getByRole('status').textContent ?? '';
    expect(shown).not.toMatch(/xi-api-key|node_modules|401/);
  });
});

describe('the visible contract', () => {
  it('states that nothing said is stored, when told to', async () => {
    render(
      <VoiceAgent
        label="Talk to the agent"
        note="Live. Your microphone is only on while you hold the session open, and nothing you say is stored by this site."
      />
    );
    expect(screen.getByText(/nothing you say is stored/i)).toBeInTheDocument();
  });
});
