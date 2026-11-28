import { FormEvent, useEffect, useRef, useState } from 'react';
import { AuthUser, createRoom, joinRoom } from './api';
import { RoomModal } from './Room';

const DURATIONS = [1, 2, 3, 5, 10, 15]; // minutos
const COUNTS = [5, 10, 15, 20]; // questões

/** Botão 🎮 no cabeçalho: menu com "Criar sala" e "Entrar em sala". */
export function GameMenu({ user }: { user: AuthUser | null }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'join' | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // Fecha o menu ao clicar fora dele.
    useEffect(() => {
        if (!menuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [menuOpen]);

    function open(m: 'create' | 'join') {
        setMenuOpen(false);
        setMode(m);
    }

    function enterRoom(code: string) {
        setMode(null);
        setRoomCode(code);
    }

    return (
        <>
            <div className="gm" ref={ref}>
                <button
                    className="gm-btn"
                    onClick={() => setMenuOpen((o) => !o)}
                    title="Jogar com amigos"
                    aria-label="Jogar com amigos"
                    aria-expanded={menuOpen}
                >
                    🎮
                </button>
                {menuOpen && (
                    <div className="gm-menu" role="menu">
                        {user ? (
                            <>
                                <button role="menuitem" onClick={() => open('create')}>
                                    ➕ Criar sala
                                </button>
                                <button role="menuitem" onClick={() => open('join')}>
                                    🔑 Entrar em sala
                                </button>
                            </>
                        ) : (
                            <p className="muted">
                                Entre com sua conta Google para jogar em sala.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {mode === 'create' && (
                <CreateRoomModal onClose={() => setMode(null)} onCreated={enterRoom} />
            )}
            {mode === 'join' && (
                <JoinRoomModal onClose={() => setMode(null)} onJoined={enterRoom} />
            )}
            {roomCode && <RoomModal code={roomCode} onClose={() => setRoomCode(null)} />}
        </>
    );
}

function CreateRoomModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (code: string) => void;
}) {
    const [duration, setDuration] = useState(5);
    const [count, setCount] = useState(10);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleCreate() {
        setBusy(true);
        setError(null);
        try {
            const { code } = await createRoom(duration, count);
            onCreated(code);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <SmallModal title="➕ Criar sala" onClose={onClose}>
            <h3 className="rp-sub">Tempo da partida</h3>
            <div className="rm-opts">
                {DURATIONS.map((d) => (
                    <button
                        key={d}
                        className={`rm-opt ${duration === d ? 'active' : ''}`}
                        onClick={() => setDuration(d)}
                        aria-pressed={duration === d}
                    >
                        {d} min
                    </button>
                ))}
            </div>

            <h3 className="rp-sub rp-sub-gap">Número de questões</h3>
            <div className="rm-opts">
                {COUNTS.map((c) => (
                    <button
                        key={c}
                        className={`rm-opt ${count === c ? 'active' : ''}`}
                        onClick={() => setCount(c)}
                        aria-pressed={count === c}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {error && <p className="error rm-error">{error}</p>}
            <button className="submit" disabled={busy} onClick={handleCreate}>
                {busy ? 'Criando sala…' : 'Criar sala'}
            </button>
        </SmallModal>
    );
}

function JoinRoomModal({
    onClose,
    onJoined,
}: {
    onClose: () => void;
    onJoined: (code: string) => void;
}) {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleJoin(e: FormEvent) {
        e.preventDefault();
        const clean = code.trim().toUpperCase();
        if (clean.length !== 6) {
            setError('O código tem 6 caracteres.');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await joinRoom(clean);
            onJoined(clean);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <SmallModal title="🔑 Entrar em sala" onClose={onClose}>
            <form onSubmit={handleJoin}>
                <label className="rp-sub" htmlFor="room-code">
                    Código da sala
                </label>
                <input
                    id="room-code"
                    className="rm-input"
                    value={code}
                    onChange={(e) =>
                        setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    }
                    maxLength={6}
                    placeholder="EX.: TKEXHT"
                    autoFocus
                    autoComplete="off"
                />
                {error && <p className="error rm-error">{error}</p>}
                <button className="submit" type="submit" disabled={busy}>
                    {busy ? 'Entrando…' : 'Entrar'}
                </button>
            </form>
        </SmallModal>
    );
}

function SmallModal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="lb-overlay" onClick={onClose}>
            <div
                className="lb-modal"
                role="dialog"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="lb-modal-head">
                    <h2 className="lb-title">{title}</h2>
                    <button className="lb-close" onClick={onClose} aria-label="Fechar">
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
