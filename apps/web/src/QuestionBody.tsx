import { AnswerResult, PublicQuestion } from './api';
import { RichText } from './rich-text';

/**
 * Enunciado, imagens e alternativas de uma questão, com a marcação de
 * certo/errado depois da resposta. Usado no modo normal e nas salas.
 */
export function QuestionBody({
    q,
    selected,
    result,
    onSelect,
}: {
    q: PublicQuestion;
    selected: string | null;
    result: AnswerResult | null;
    onSelect: (letter: string) => void;
}) {
    const answered = result !== null;

    return (
        <>
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
                    const isCorrect = answered && result!.correctAlternative === a.letter;
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
                                onClick={() => onSelect(a.letter)}
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
        </>
    );
}
