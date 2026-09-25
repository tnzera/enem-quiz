import React from 'react';

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


export function RichText({ text }: { text: string | null }) {
    if (!text) return null;
    const parts = text.split(/(!\[[^\]]*\]\([^)]*\))/g);
    return (
        <>
            {parts.map((part, i) => {
                const img = part.match(/^!\[[^\]]*\]\(([^)]*)\)$/);
                if (img) {
                    return <img key={i} src={img[1]} alt="" className="q-img" />;
                }
                const html = escapeHtml(part)
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>');
                return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
            })}
        </>
    );
}
