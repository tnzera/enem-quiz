import { useEffect, useState } from 'react';
import {
    AnswerResult,
    Daily,
    getDaily,
    getDeviceToken,
    submitAnswer,
} from './api';
import { RichText } from './rich-text';

export default function App() {
    const [daily, setDaily] = useState<Daily | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        getDaily().then(setDaily).catch((e) => setError(e.message));
    }, []);

    async function handleSubmit() {
        if (!daily || !selected) return;
        setSending(true);
        setError(null);
        try {
            const res = await submitAnswer({
                deviceToken: getDeviceToken(),
                year: daily.year,
                index: daily.index,
                language: daily.language,
                choice: selected,
            });
            setResult(res);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSending(false);
        }
    }

    if (error) return <main className="wrap"><p className="error">{error}</p></main>;
    if (!daily) return <main className="wrap"><p className="muted">Carregando o desafio do dia…</p></main>;

    const q = daily.question;
    const answered = result !== null;

    return (
        <main className="wrap">
            <header className="top">
                <div>
                    <h1>ENEM Quiz</h1>
                    <p className="muted">Desafio do dia · {daily.date}</p>
                </div>
                {result && (
                    <div className="streak" title="Sequência de dias">
                        🔥 {result.streak}
                    </div>
                )}
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

                {/* Só mostra imagens de files[]*/}
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
                        const isCorrect = answered && result!.correctAlternative === a.letter;
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
                                        {a.file ? <img src={a.file} alt="" className="q-img" /> : null}
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
                    <div className={`feedback ${result!.correct ? 'ok' : 'no'}`}>
                        {result!.alreadyAnswered
                            ? 'Você já respondeu o desafio de hoje.'
                            : result!.correct
                              ? 'Acertou! 🎉'
                              : 'Errou.'}{' '}
                        A alternativa correta é <strong>{result!.correctAlternative}</strong>.
                        <br />
                        Volte amanhã para um novo desafio.
                    </div>
                )}
            </section>
        </main>
    );
}
