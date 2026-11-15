import { DisciplineReport } from './api';

const LABELS: Record<string, string> = {
    linguagens: 'Linguagens',
    'ciencias-humanas': 'Ciências Humanas',
    'ciencias-natureza': 'Ciências da Natureza',
    matematica: 'Matemática',
};

export function Report({ data }: { data: DisciplineReport[] | null }) {
    if (!data) {
        return <p className="muted lb-empty">Carregando desempenho…</p>;
    }
    if (data.length === 0) {
        return (
            <p className="muted lb-empty">
                Responda questões para ver sua taxa de acerto por matéria.
            </p>
        );
    }

    return (
        <ul className="rp-list">
            {data.map((d) => (
                <li key={d.discipline} className="rp-row">
                    <div className="rp-head">
                        <span className="rp-name">
                            {LABELS[d.discipline] ?? d.discipline}
                        </span>
                        <span className="rp-rate">{d.rate}%</span>
                    </div>
                    <div className="rp-bar">
                        <div className="rp-fill" style={{ width: `${d.rate}%` }} />
                    </div>
                    <span className="rp-count">
                        {d.correct} de {d.total} corretas
                    </span>
                </li>
            ))}
        </ul>
    );
}
