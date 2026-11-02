import { useState } from 'react';
import { LeaderRow, LeaderboardData } from './api';

function LbAvatar({ picture, name }: { picture: string | null; name: string }) {
    const [err, setErr] = useState(false);
    if (picture && !err) {
        return (
            <img
                className="lb-avatar"
                src={picture}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setErr(true)}
            />
        );
    }
    return (
        <span className="lb-avatar lb-avatar-fallback">
            {(name || '?').charAt(0).toUpperCase()}
        </span>
    );
}

function Row({ r, me }: { r: LeaderRow; me: boolean }) {
    return (
        <li className={`lb-row ${me ? 'lb-me' : ''}`}>
            <span className="lb-rank">{r.rank}</span>
            <LbAvatar picture={r.picture} name={r.name} />
            <span className="lb-name">{r.name}</span>
            <span className="lb-score">{r.score}</span>
        </li>
    );
}

export function Leaderboard({
    data,
    loading,
    meId,
}: {
    data: LeaderboardData | null;
    loading: boolean;
    meId: string | null;
}) {
    if (loading && !data) {
        return <p className="muted">Carregando ranking…</p>;
    }
    if (!data || data.top.length === 0) {
        return (
            <p className="muted lb-empty">
                Ainda não há pontuações. Entre com sua conta e responda questões
                para aparecer aqui!
            </p>
        );
    }

    const inTop = data.me
        ? data.top.some((r) => r.userId === data.me!.userId)
        : false;

    return (
        <div className="lb">
            <ol className="lb-list">
                {data.top.map((r) => (
                    <Row key={r.userId} r={r} me={r.userId === meId} />
                ))}
            </ol>
            {data.me && !inTop && (
                <>
                    <div className="lb-sep">⋯</div>
                    <ol className="lb-list">
                        <Row r={data.me} me />
                    </ol>
                </>
            )}
        </div>
    );
}
