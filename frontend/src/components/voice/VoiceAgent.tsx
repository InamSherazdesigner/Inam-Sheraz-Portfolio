'use client';

/**
 * THE VOICE AGENT.
 *
 * The thesis includes an AI agent trained on the research that speaks in Inam's
 * cloned voice and discusses the thesis "Moodiyan Ton Agge".
 *
 * Supports:
 *   - Claude + ElevenLabs Cloned Voice audio synthesis (Method 2).
 *   - ElevenLabs Conversational AI WebSockets when configured.
 *   - Live microphone voice recognition and audio playback.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestVoiceSession, sendVoiceChatMessage } from '@/lib/api';

type State = 'idle' | 'connecting' | 'live' | 'error' | 'unsupported';
type Speaker = 'you' | 'agent';

interface Turn {
  id: number;
  who: Speaker;
  text: string;
}

interface Conversation {
  endSession: () => Promise<void>;
  setVolume?: (options: { volume: number }) => void;
}

interface VoiceAgentProps {
  label: string;
  note?: string;
}

const initialState = (): State => {
  if (typeof window === 'undefined') return 'idle';
  return 'idle';
};

export function VoiceAgent({ label, note }: VoiceAgentProps) {
  const [state, setState] = useState<State>(initialState);
  const [status, setStatus] = useState('');
  const [speaking, setSpeaking] = useState<Speaker | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const conversationRef = useRef<Conversation | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const turnId = useRef(0);
  const alive = useRef(true);

  // Stop active session & audio
  const stop = useCallback(async () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    const conversation = conversationRef.current;
    conversationRef.current = null;
    setSpeaking(null);

    if (conversation) {
      try {
        await conversation.endSession();
      } catch {
        // Ignore
      }
    }
    if (!alive.current) return;
    setState('idle');
    setStatus('Session ended.');
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      void conversationRef.current?.endSession();
      conversationRef.current = null;
    };
  }, []);

  // Send message to Claude + ElevenLabs Voice TTS pipeline
  const sendChatMessage = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim() || isProcessing) return;
      setIsProcessing(true);
      setSpeaking('you');

      turnId.current += 1;
      const userTurn: Turn = { id: turnId.current, who: 'you', text: textToSend.trim() };
      setTurns((prev) => [...prev.slice(-30), userTurn]);
      setStatus('Inam is thinking…');

      try {
        const history = turns.map((t) => ({
          role: t.who === 'you' ? 'user' : 'assistant',
          content: t.text,
        }));

        const result = await sendVoiceChatMessage({
          messages: history,
          userText: textToSend.trim(),
        });

        if (!alive.current) return;

        if (result.ok) {
          turnId.current += 1;
          const agentTurn: Turn = { id: turnId.current, who: 'agent', text: result.reply };
          setTurns((prev) => [...prev.slice(-30), agentTurn]);
          setStatus('Inam speaking…');
          setSpeaking('agent');

          // Play ElevenLabs audio
          if (result.audioBase64) {
            if (currentAudioRef.current) {
              currentAudioRef.current.pause();
            }
            const audio = new Audio(`data:audio/mpeg;base64,${result.audioBase64}`);
            currentAudioRef.current = audio;

            audio.onended = () => {
              if (alive.current) {
                setSpeaking(null);
                setStatus('Listening… Say or ask something else.');
              }
            };
            audio.onerror = () => {
              if (alive.current) {
                setSpeaking(null);
                setStatus('Listening…');
              }
            };
            await audio.play().catch(() => {
              setSpeaking(null);
              setStatus('Listening…');
            });
          } else {
            setSpeaking(null);
            setStatus('Listening…');
          }
        } else {
          setStatus(result.message || 'Could not connect to the agent.');
          setSpeaking(null);
        }
      } catch (err) {
        console.error('[voice] sendChatMessage error', err);
        setStatus('Error sending message. Try again.');
        setSpeaking(null);
      } finally {
        if (alive.current) {
          setIsProcessing(false);
        }
      }
    },
    [turns, isProcessing]
  );

  // Setup Web Speech API for voice mic input
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          if (transcript && transcript.trim()) {
            void sendChatMessage(transcript);
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('[speech-recognition] error:', e.error);
        }
      };

      recognition.onend = () => {
        if (alive.current && state === 'live') {
          try {
            recognition.start();
          } catch {
            // Ignore
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      // Speech recognition not available or denied
    }
  }, [sendChatMessage, state]);

  const start = useCallback(async () => {
    if (state === 'connecting' || state === 'live') return;

    setState('connecting');
    setStatus('Connecting to Inam’s cloned voice agent…');
    setTurns([]);

    const result = await requestVoiceSession();
    if (!alive.current) return;

    if (!result.ok) {
      setState('error');
      setStatus(result.message);
      return;
    }

    // Method 1: ElevenLabs WebSocket ConvAI (if signedUrl provided)
    if (result.session.signedUrl && result.session.provider === 'elevenlabs') {
      try {
        const { Conversation: ElevenLabsConversation } = await import('@elevenlabs/client');

        const conversation = await ElevenLabsConversation.startSession({
          signedUrl: result.session.signedUrl,
          connectionType: 'websocket',
          onConnect: () => {
            if (!alive.current) return;
            setState('live');
            setStatus('Connected. Just talk — Inam is listening.');
          },
          onDisconnect: () => {
            if (!alive.current) return;
            conversationRef.current = null;
            setState('idle');
            setSpeaking(null);
            setStatus('Session ended.');
          },
          onError: (error: unknown) => {
            if (!alive.current) return;
            conversationRef.current = null;
            setState('error');
            setSpeaking(null);
            console.error('[voice] session error', error);
            setStatus('The connection dropped. Try starting the session again.');
          },
          onModeChange: ({ mode }: { mode: string }) => {
            if (!alive.current) return;
            setSpeaking(mode === 'speaking' ? 'agent' : 'you');
          },
          onMessage: ({ message, source }: { message: string; source: string }) => {
            if (!alive.current || !message) return;
            turnId.current += 1;
            setTurns((previous) => [
              ...previous.slice(-40),
              { id: turnId.current, who: source === 'ai' ? 'agent' : 'you', text: message },
            ]);
          },
        });

        if (!alive.current) {
          await conversation.endSession();
          return;
        }
        conversationRef.current = conversation as unknown as Conversation;
        return;
      } catch (error) {
        console.error('[voice] fallback to Claude TTS', error);
      }
    }

    // Method 2: Claude + ElevenLabs Cloned Voice Pipeline
    setState('live');
    setStatus('Connected. Inam’s voice agent is ready. Ask or speak below.');

    // Initial greeting from Inam
    turnId.current += 1;
    const greeting: Turn = {
      id: turnId.current,
      who: 'agent',
      text: 'Hi, I’m Inam. Ask me anything about Moodiyan Ton Agge and my parents’ recordings.',
    };
    setTurns([greeting]);

    // Start microphone recognition if supported
    startSpeechRecognition();
  }, [state, startSpeechRecognition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText;
    setInputText('');
    void sendChatMessage(text);
  };

  const busy = state === 'connecting';
  const live = state === 'live';

  return (
    <div className="voice" data-state={state} style={{ border: '2px solid #FFA827', background: '#0F0D0A', padding: '1.25rem', borderRadius: '4px', margin: '2rem 0' }}>
      <div className="voice__head" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFA827', fontFamily: 'monospace', fontWeight: 700 }}>
        <span
          className="voice__lamp"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: live ? (speaking ? '#48BB78' : '#FFA827') : '#718096',
            boxShadow: live ? '0 0 8px #FFA827' : 'none',
          }}
        />
        VOICE AGENT · INAM (CLONED VOICE)
      </div>

      <p className="voice__label" style={{ color: '#E2E8F0', marginTop: '0.5rem', fontSize: '0.95rem' }}>{label}</p>

      <div className="voice__controls" style={{ marginTop: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {live ? (
          <button
            type="button"
            className="voice__btn voice__btn--stop"
            onClick={stop}
            style={{ background: '#E53E3E', color: '#fff', border: 'none', padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
          >
            ■ END SESSION
          </button>
        ) : (
          <button
            type="button"
            className="voice__btn"
            onClick={start}
            disabled={busy}
            style={{ background: '#FFA827', color: '#000', border: 'none', padding: '8px 18px', fontFamily: 'monospace', fontWeight: 800, cursor: 'pointer' }}
          >
            {busy ? '… CONNECTING' : '▸ START TALKING'}
          </button>
        )}

        <a
          href="/moodiyan-agent/index.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'transparent',
            color: '#FFA827',
            border: '1px solid #FFA827',
            padding: '8px 16px',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📖 OPEN ORIGINAL EXHIBITION DIARY APP ↗
        </a>
      </div>

      <p
        className={state === 'error' ? 'voice__status voice__status--error' : 'voice__status'}
        role="status"
        aria-live="polite"
        style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: state === 'error' ? '#FEB2B2' : '#CBD5E0', fontFamily: 'monospace' }}
      >
        {status}
      </p>

      {live && speaking ? (
        <p className="voice__turn" style={{ color: '#FFA827', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          🔊 {speaking === 'agent' ? 'INAM (CLONED VOICE)' : 'YOU'} speaking…
        </p>
      ) : null}

      {/* Interactive text and voice prompt input */}
      {live ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Inam about the thesis, the projections, or his parents…"
            disabled={isProcessing}
            style={{
              flex: 1,
              background: '#1A1612',
              border: '1px solid #FFA827',
              color: '#FFF',
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              borderRadius: '2px',
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            style={{
              background: isProcessing ? '#4A4033' : '#FFA827',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontWeight: 800,
              cursor: isProcessing ? 'default' : 'pointer',
            }}
          >
            {isProcessing ? '…' : 'SEND'}
          </button>
        </form>
      ) : null}

      {turns.length > 0 ? (
        <ul
          className="voice__log"
          style={{
            listStyle: 'none',
            padding: '10px',
            margin: '1rem 0 0 0',
            background: '#14120E',
            border: '1px solid #332B20',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {turns.map((turn) => (
            <li
              key={turn.id}
              data-who={turn.who}
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.4,
                color: turn.who === 'agent' ? '#FFA827' : '#E2E8F0',
              }}
            >
              <b style={{ marginRight: '6px', color: turn.who === 'agent' ? '#FFA827' : '#90CDF4' }}>
                {turn.who === 'agent' ? 'INAM:' : 'YOU:'}
              </b>
              <span>{turn.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? <p className="voice__note" style={{ fontSize: '0.8rem', color: '#A0AEC0', marginTop: '1rem' }}>{note}</p> : null}
    </div>
  );
}
