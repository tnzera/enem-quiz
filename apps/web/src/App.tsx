import { useEffect, useState } from 'react';
import {
    AnswerResult,
    AuthUser,
    LOGIN_URL,
    RandomQuestion,
    checkAnswer,
    consumeTokenFromUrl,
    getMe,
    getRandomQuestion,
    logout,
} from './api';
import { RichText } from './rich-text';

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

    // Carrega a primeira questão e verifica quem está logado ao abrir.
    useEffect(() => {
        consumeTokenFromUrl(); // captura o token da volta do login (#token=...)
        void loadNext([]);
        void getMe().then(setUser);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleLogout() {
        await logout();
        setUser(null);
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
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSending(false);
        }
    }

    if (error) {
        return (
            <main className="wrap">
                <p className="error">{error}</p>
                <button className="submit" onClick={() => loadNext(seen)}>
                    Tentar novamente
                </button>
            </main>
        );
    }
    if (loading || !current) {
        return (
            <main className="wrap">
                <p className="muted">Carregando a questão…</p>
            </main>
        );
    }

    const q = current.question;
    const answered = result !== null;

    return (
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
                            <span className="user-name">{user.name || user.email}</span>
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
                        const isWrongChoice = answered && isChosen && !result!.correct;
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
                                            <img src={a.file} alt="" className="q-img" />
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
                        <div className={`feedback ${result!.correct ? 'ok' : 'no'}`}>
                            {result!.correct ? 'Acertou! 🎉' : 'Errou.'} A alternativa
                            correta é <strong>{result!.correctAlternative}</strong>.
                        </div>
                        <button className="submit" onClick={() => loadNext(seen)}>
                            Próxima questão →
                        </button>
                    </>
                )}
            </section>
        </main>
    );
}
