import { useState } from 'react';
import { MonthlyPoint } from './api';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** 'YYYY-MM' -> 'nov/26' */
function monthLabel(key: string): string {
    const [y, m] = key.split('-');
    return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

/** Meses consecutivos do primeiro com dados até o mês atual (no máximo 12). */
function monthRange(first: string): string[] {
    const now = new Date();
    const end = now.getFullYear() * 12 + now.getMonth();
    const [fy, fm] = first.split('-').map(Number);
    const start = Math.max(fy * 12 + (fm - 1), end - 11);
    const out: string[] = [];
    for (let i = start; i <= end; i++) {
        const y = Math.floor(i / 12);
        const m = (i % 12) + 1;
        out.push(`${y}-${String(m).padStart(2, '0')}`);
    }
    return out;
}

const fmtRate = (r: number) => `${r.toLocaleString('pt-BR')}%`;

// Geometria (unidades do viewBox; o SVG escala com a largura do cartão).
const W = 300;
const H = 170;
const PAD = { top: 18, right: 16, bottom: 26, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const TICKS = [0, 25, 50, 75, 100];

export function EvolutionChart({ data }: { data: MonthlyPoint[] }) {
    const [hover, setHover] = useState<number | null>(null);

    if (data.length === 0) return null;

    const byMonth = new Map(data.map((d) => [d.month, d]));
    const months = monthRange(data[0].month);
    const n = months.length;

    const x = (i: number) =>
        n === 1 ? PAD.left + PLOT_W / 2 : PAD.left + (i / (n - 1)) * PLOT_W;
    const y = (rate: number) => PAD.top + (1 - rate / 100) * PLOT_H;

    const points = months.map((m, i) => {
        const d = byMonth.get(m);
        return d ? { i, d, cx: x(i), cy: y(d.rate) } : null;
    });

    // Linha quebrada nos meses sem resposta (lacuna, não 0%).
    let line = '';
    let area = '';
    let run: { cx: number; cy: number }[] = [];
    const flush = () => {
        if (run.length > 1) {
            line += run.map((p, k) => `${k ? 'L' : 'M'}${p.cx},${p.cy}`).join(' ') + ' ';
            area +=
                `M${run[0].cx},${y(0)} ` +
                run.map((p) => `L${p.cx},${p.cy}`).join(' ') +
                ` L${run[run.length - 1].cx},${y(0)} Z `;
        }
        run = [];
    };
    points.forEach((p) => (p ? run.push(p) : flush()));
    flush();

    const last = [...points].reverse().find(Boolean)!;
    const labelEvery = n > 6 ? 2 : 1;
    const hovered = hover !== null ? points[hover] : null;

    const summary = data
        .map((d) => `${monthLabel(d.month)}: ${fmtRate(d.rate)}`)
        .join('; ');

    return (
        <div className="ev">
            <div className="ev-plot">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    role="img"
                    aria-label={`Taxa de acerto por mês. ${summary}`}
                >
                    {TICKS.map((t) => (
                        <g key={t}>
                            <line
                                x1={PAD.left}
                                x2={W - PAD.right}
                                y1={y(t)}
                                y2={y(t)}
                                className="ev-grid"
                            />
                            <text
                                x={PAD.left - 6}
                                y={y(t)}
                                className="ev-tick"
                                textAnchor="end"
                                dominantBaseline="middle"
                            >
                                {t}%
                            </text>
                        </g>
                    ))}

                    {months.map((m, i) =>
                        i % labelEvery === 0 || i === n - 1 ? (
                            <text
                                key={m}
                                x={x(i)}
                                y={H - 8}
                                className="ev-tick"
                                textAnchor="middle"
                            >
                                {monthLabel(m)}
                            </text>
                        ) : null,
                    )}

                    <path d={area} className="ev-area" />
                    <path d={line} className="ev-line" />

                    {points.map((p) =>
                        p ? (
                            <circle
                                key={p.i}
                                cx={p.cx}
                                cy={p.cy}
                                r={hover === p.i ? 5.5 : 4.5}
                                className="ev-dot"
                            />
                        ) : null,
                    )}

                    {/* Rótulo direto só no último ponto */}
                    <text
                        x={last.cx}
                        y={last.cy - 10}
                        className="ev-label"
                        textAnchor={n === 1 ? 'middle' : 'end'}
                    >
                        {fmtRate(last.d.rate)}
                    </text>

                    {/* Alvos de hover/foco maiores que o ponto */}
                    {points.map((p) =>
                        p ? (
                            <circle
                                key={`hit-${p.i}`}
                                cx={p.cx}
                                cy={p.cy}
                                r={14}
                                className="ev-hit"
                                tabIndex={0}
                                aria-label={`${monthLabel(p.d.month)}: ${fmtRate(p.d.rate)}, ${p.d.correct} de ${p.d.total} corretas`}
                                onMouseEnter={() => setHover(p.i)}
                                onMouseLeave={() => setHover(null)}
                                onFocus={() => setHover(p.i)}
                                onBlur={() => setHover(null)}
                            />
                        ) : null,
                    )}
                </svg>

                {hovered && (
                    <div
                        className="ev-tip"
                        style={{
                            left: `${(hovered.cx / W) * 100}%`,
                            top: `${(hovered.cy / H) * 100}%`,
                        }}
                    >
                        <strong>{monthLabel(hovered.d.month)}</strong>{' '}
                        {fmtRate(hovered.d.rate)}
                        <br />
                        {hovered.d.correct} de {hovered.d.total} corretas
                    </div>
                )}
            </div>

            {data.length === 1 && (
                <p className="muted ev-note">
                    A linha de evolução aparece a partir do segundo mês com respostas.
                </p>
            )}

            {/* Visão em tabela para leitores de tela */}
            <table className="sr-only">
                <caption>Taxa de acerto por mês</caption>
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Taxa</th>
                        <th>Corretas</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.month}>
                            <td>{monthLabel(d.month)}</td>
                            <td>{fmtRate(d.rate)}</td>
                            <td>{d.correct}</td>
                            <td>{d.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
