import { useEffect, useState } from 'react';
import {
    AnswerResult,
    AuthUser,
    LOGIN_URL,
    LeaderboardData,
    RandomQuestion,
    checkAnswer,
    consumeTokenFromUrl,
    getLeaderboard,
    getMe,
    getRandomQuestion,
    logout,
} from './api';
import { RichText } from './rich-text';
import { Leaderboard } from './Leaderboard';

export default function App() {
    const [current, setCurrent] = useState<RandomQuestion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    // Gamificação e controle de repetição (só na sessão).
    const [streak, setStreak] = useState(0);
    const [seen, setSeen] = useState<string[]>([]);

    // Autenticação.
    const [user, setUser] = useState<AuthUser | null>(null);
    const [avatarError, setAvatarError] = useState(false);

    // Ranking.
    const [lb, setLb] = useState<LeaderboardData | null>(null);
    const [lbLoading, setLbLoading] = useState(true);
    const [lbOpen, setLbOpen] = useState(false);

    // Carrega questão, usuário e ranking ao abrir.
    useEffect(() => {
        consumeTokenFromUrl(); // captura o token da volta do login (#token=...)
        void loadNext([]);
        void getMe().then(setUser);
        void loadLeaderboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadLeaderboard() {
        setLbLoading(true);
        try {
            setLb(await getLeaderboard());
        } catch {
            /* ignore */
        } finally {
            setLbLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        setUser(null);
        void loadLeaderboard();
    }

    async function loadNext(exclude: string[]) {
        setLoading(true);
        setError(null);
        setSelected(null);
        setResult(null);
        try {
            const q = await getRandomQuestion(exclude);
            setCurrent(q);
            setSeen((prev) => [...prev, q.id]);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (!current || !selected) return;
        setSending(true);
        setError(null);
        try {
            const res = await checkAnswer({
                year: current.year,
                index: current.index,
                language: current.language,
                choice: selected,
            });
            setResult(res);
            setStreak((s) => (res.correct ? s + 1 : 0));
            void loadLeaderboard(); // o score pode ter mudado
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSending(false);
        }
    }

    const q = current?.question;
    const answered = result !== null;

    const leaderboard = (
        <Leaderboard data={lb} loading={lbLoading} meId={user?.id ?? null} />
    );

    return (
        <div className="layout">
            <main className="wrap">
                <header className="top">
                    <div>
                        <h1>ENEM Quiz</h1>
                        <p className="muted">Pratique questões do ENEM</p>
                    </div>
                    <div className="top-right">
                        {user ? (
                            <div className="user">
                                {user.picture && !avatarError ? (
                                    <img
                                        className="avatar"
                                        src={user.picture}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <span className="avatar avatar-fallback">
                                        {(user.name || user.email || '?')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                )}
                                <span className="user-name">
                                    {user.name || user.email}
                                </span>
                                <button className="link-btn" onClick={handleLogout}>
                                    Sair
                                </button>
                            </div>
                        ) : (
                            <a className="login-btn" href={LOGIN_URL}>
                                Entrar com Google
                            </a>
                        )}
                        <div className="streak" title="Acertos seguidos">
                            🔥 {streak}
                        </div>
                    </div>
                </header>

                {error ? (
                    <section className="card">
                        <p className="error">{error}</p>
                        <button className="submit" onClick={() => loadNext(seen)}>
                            Tentar novamente
                        </button>
                    </section>
                ) : loading || !q || !current ? (
                    <section className="card">
                        <p className="muted">Carregando a questão…</p>
                    </section>
                ) : (
                    <section className="card">
                        <p className="tag">
                            {q.title}
                            {q.discipline ? ` · ${q.discipline}` : ''}
                            {q.language ? ` · ${q.language}` : ''}
                        </p>

                        <div className="context">
                            <RichText text={q.context} />
                        </div>

                        {q.files
                            .filter((f) => !(q.context && q.context.includes(f)))
                            .map((f, i) => (
                                <img key={i} src={f} alt="" className="q-img" />
                            ))}

                        {q.alternativesIntroduction && (
                            <p className="intro">
                                <RichText text={q.alternativesIntroduction} />
                            </p>
                        )}

                        <ul className="alts">
                            {q.alternatives.map((a) => {
                                const isChosen = selected === a.letter;
                                const isCorrect =
                                    answered && result!.correctAlternative === a.letter;
                                const isWrongChoice =
                                    answered && isChosen && !result!.correct;
                                const cls = [
                                    'alt',
                                    isChosen ? 'chosen' : '',
                                    isCorrect ? 'correct' : '',
                                    isWrongChoice ? 'wrong' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ');
                                return (
                                    <li key={a.letter}>
                                        <button
                                            className={cls}
                                            disabled={answered}
                                            onClick={() => setSelected(a.letter)}
                                        >
                                            <span className="letter">{a.letter}</span>
                                            <span className="alt-text">
                                                {a.text ? <RichText text={a.text} /> : null}
                                                {a.file ? (
                                                    <img
                                                        src={a.file}
                                                        alt=""
                                                        className="q-img"
                                                    />
                                                ) : null}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {!answered ? (
                            <button
                                className="submit"
                                disabled={!selected || sending}
                                onClick={handleSubmit}
                            >
                                {sending ? 'Enviando…' : 'Responder'}
                            </button>
                        ) : (
                            <>
                                <div
                                    className={`feedback ${
                                        result!.correct ? 'ok' : 'no'
                                    }`}
                                >
                                    {result!.correct ? 'Acertou! 🎉' : 'Errou.'} A
                                    alternativa correta é{' '}
                                    <strong>{result!.correctAlternative}</strong>.
                                </div>
                                <button
                                    className="submit"
                                    onClick={() => loadNext(seen)}
                                >
                                    Próxima questão →
                                </button>
                            </>
                        )}
                    </section>
                )}
            </main>

            {/* Ranking — lateral direita (desktop) */}
            <aside className="lb-aside">
                <h2 className="lb-title">🏆 Ranking</h2>
                {leaderboard}
            </aside>

            {/* Botão flutuante + modal (telas menores) */}
            <button
                className="lb-fab"
                onClick={() => setLbOpen(true)}
                title="Ver ranking"
            >
                🏆
            </button>
            {lbOpen && (
                <div className="lb-overlay" onClick={() => setLbOpen(false)}>
                    <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lb-modal-head">
                            <h2 className="lb-title">🏆 Ranking</h2>
                            <button
                                className="lb-close"
                                onClick={() => setLbOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        {leaderboard}
                    </div>
                </div>
            )}
        </div>
    );
}
