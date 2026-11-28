import { useCallback, useEffect, useRef, useState } from 'react';
import { AnswerResult, RoomState, answerRoom, getRoom, startRoom } from './api';
import { QuestionBody } from './QuestionBody';

const POLL_MS = 1500;
const MAX_PLAYERS = 10;

function fmtTime(ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Initial({ name }: { name: string }) {
    return (
        <span className="lb-avatar lb-avatar-fallback">
            {(name || '?').charAt(0).toUpperCase()}
        </span>
    );
}

export function RoomModal({ code, onClose }: { code: string; onClose: () => void }) {
    const [room, setRoom] = useState<RoomState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fetchedAt, setFetchedAt] = useState(Date.now());
    const [now, setNow] = useState(Date.now());
    const [shown, setShown] = useState<RoomState['question']>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [result, setResult] = useState<(AnswerResult & { done: boolean }) | null>(null);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    // Enquanto o feedback da resposta está na tela, a consulta periódica não
    // troca a questão exibida (o servidor já avançou para a próxima).
    const resultRef = useRef(result);
    resultRef.current = result;

    const refresh = useCallback(async () => {
        try {
            const r = await getRoom(code);
            setRoom(r);
            setFetchedAt(Date.now());
            setError(null);
            if (!resultRef.current) setShown(r.question);
            return r;
        } catch (e) {
            setError((e as Error).message);
            return null;
        }
    }, [code]);

    const finished = room?.status === 'finished';

    // Consulta o estado da sala a cada 1,5 s até a partida terminar.
    useEffect(() => {
        if (finished) return;
        void refresh();
        const id = setInterval(() => void refresh(), POLL_MS);
        return () => clearInterval(id);
    }, [refresh, finished]);

    // Relógio local para o cronômetro andar suave entre as consultas.
    useEffect(() => {
        if (room?.status !== 'playing') return;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [room?.status]);

    async function handleStart() {
        setBusy(true);
        try {
            await startRoom(code);
            await refresh();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    async function handleAnswer() {
        if (!selected) return;
        setBusy(true);
        try {
            setResult(await answerRoom(code, selected));
        } catch (e) {
            setError((e as Error).message);
            void refresh();
        } finally {
            setBusy(false);
        }
    }

    async function handleNext() {
        setResult(null);
        setSelected(null);
        const r = await refresh();
        setShown(r?.question ?? null);
    }

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    }

    const remaining =
        room?.remainingMs != null
            ? Math.max(0, room.remainingMs - (now - fetchedAt))
            : null;

    let title = `Sala ${code}`;
    if (room?.status === 'playing') title = `Sala ${code} · em andamento`;
    if (finished) title = 'Resultado da partida';

    return (
        <div className="lb-overlay">
            <div className="lb-modal rm-modal" role="dialog" aria-label={title}>
                <div className="lb-modal-head">
                    <h2 className="lb-title">🎮 {title}</h2>
                    <button className="lb-close" onClick={onClose} aria-label="Fechar">
                        ✕
                    </button>
                </div>

                {error && <p className="error rm-error">{error}</p>}

                {!room ? (
                    !error && <p className="muted">Carregando a sala…</p>
                ) : room.status === 'waiting' ? (
                    <>
                        <div className="rm-code-box">
                            <span className="rm-code-label">Código da sala</span>
                            <span className="rm-code">{room.code}</span>
                            <button className="link-btn" onClick={copyCode}>
                                {copied ? 'Copiado!' : 'Copiar código'}
                            </button>
                        </div>
                        <p className="muted rm-config">
                            {room.durationMinutes} min · {room.questionCount} questões
                        </p>

                        <h3 className="rp-sub">
                            Participantes ({room.players.length}/{MAX_PLAYERS})
                        </h3>
                        <ul className="rm-players">
                            {room.players.map((p) => (
                                <li key={p.userId}>
                                    <Initial name={p.name} />
                                    <span>{p.name}</span>
                                    {p.isHost && <span className="rm-badge">criador</span>}
                                </li>
                            ))}
                        </ul>

                        {room.isHost ? (
                            <button className="submit" disabled={busy} onClick={handleStart}>
                                {busy ? 'Iniciando…' : 'Iniciar partida'}
                            </button>
                        ) : (
                            <p className="muted rm-wait">
                                Aguardando o criador iniciar a partida…
                            </p>
                        )}
                    </>
                ) : room.status === 'playing' ? (
                    <>
                        <div className="rm-status">
                            <span className="rm-timer" aria-live="off">
                                ⏱ {remaining !== null ? fmtTime(remaining) : '--:--'}
                            </span>
                            <span className="muted">
                                {shown
                                    ? `Questão ${shown.position} de ${room.questionCount}`
                                    : `${room.me.answered} de ${room.questionCount} respondidas`}
                            </span>
                        </div>

                        {shown ? (
                            <>
                                <QuestionBody
                                    q={shown}
                                    selected={selected}
                                    result={result}
                                    onSelect={setSelected}
                                />
                                {!result ? (
                                    <button
                                        className="submit"
                                        disabled={!selected || busy}
                                        onClick={handleAnswer}
                                    >
                                        {busy ? 'Enviando…' : 'Responder'}
                                    </button>
                                ) : (
                                    <>
                                        <div className={`feedback ${result.correct ? 'ok' : 'no'}`}>
                                            {result.correct ? 'Acertou! 🎉' : 'Errou.'} A
                                            alternativa correta é{' '}
                                            <strong>{result.correctAlternative}</strong>.
                                        </div>
                                        <button className="submit" onClick={handleNext}>
                                            {result.done ? 'Concluir' : 'Próxima questão →'}
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="rm-done">
                                    ✅ Você respondeu todas as questões! Aguardando os
                                    outros participantes ou o fim do tempo.
                                </p>
                                <ul className="rm-players">
                                    {room.players.map((p) => (
                                        <li key={p.userId}>
                                            <Initial name={p.name} />
                                            <span>{p.name}</span>
                                            <span className="rm-progress">
                                                {p.answered}/{room.questionCount}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                ) : (
                    <Results room={room} onClose={onClose} />
                )}
            </div>
        </div>
    );
}

function Results({ room, onClose }: { room: RoomState; onClose: () => void }) {
    const results = room.results ?? [];
    const winners = results.filter((r) => r.winner);

    return (
        <>
            <div className="rm-winner">
                <span className="rm-trophy">🏆</span>
                {winners.length === 0 ? (
                    <span>Ninguém acertou nenhuma questão.</span>
                ) : winners.length === 1 ? (
                    <span>
                        Vencedor: <strong>{winners[0].name}</strong>
                    </span>
                ) : (
                    <span>
                        Empate: <strong>{winners.map((w) => w.name).join(' e ')}</strong>
                    </span>
                )}
            </div>

            <div className="rm-table-wrap">
                <table className="rm-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Participante</th>
                            <th>Acertos</th>
                            <th>Erros</th>
                            <th>Sem resposta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r, i) => (
                            <tr key={r.userId} className={r.winner ? 'rm-win' : ''}>
                                <td>{i + 1}</td>
                                <td>{r.name}</td>
                                <td>{r.correct}</td>
                                <td>{r.wrong}</td>
                                <td>{r.unanswered}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="submit" onClick={onClose}>
                Fechar
            </button>
        </>
    );
}
