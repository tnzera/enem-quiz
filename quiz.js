#!/usr/bin/env node
// ENEM Quiz — picks a random question from the public enem.dev API,
// asks the user, and validates whether the answer is correct.
//
// Usage:
//   node quiz.js                 # random year, random question, keep playing
//   node quiz.js --year 2022     # restrict to a specific year
//   node quiz.js --discipline matematica
//   node quiz.js --count 5       # play exactly 5 questions then stop
//
// No dependencies — uses Node's built-in fetch (Node 18+) and readline.

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Base da API. Precedência (maior primeiro):
//   --api <url>  >  --local  >  variável ENEM_API_BASE  >  API pública
// Reatribuída em main() depois de ler os argumentos.
const PUBLIC_API = 'https://api.enem.dev/v1';
const LOCAL_API = 'http://localhost:3000/v1';
let API_BASE = process.env.ENEM_API_BASE ?? PUBLIC_API;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ----arg parser -------------------------------------------------------
function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        const key = argv[i];
        if (key.startsWith('--')) {
            const name = key.slice(2);
            const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
            args[name] = value;
        }
    }
    return args;
}

// ---- API helpers -----------------------------------------------------------
async function api(path) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText} (${url})`);
    }
    return res.json();
}

const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

// Ask a question; if stdin is closed (EOF / Ctrl-D / piped input ends),
// return null so callers can treat it as "quit" instead of crashing.
async function ask(rl, prompt) {
    try {
        return await rl.question(prompt);
    } catch {
        return null;
    }
}

async function getYears() {
    const exams = await api('/exams');
    return exams.map(e => e.year);
}

async function getQuestionStubs(year) {
    const exam = await api(`/exams/${year}`);
    return exam.questions; // [{ title, index, discipline, language }]
}

async function getQuestion(year, index, language) {
    const query = language ? `?language=${encodeURIComponent(language)}` : '';
    return api(`/exams/${year}/questions/${index}${query}`);
}

// ---- rendering -------------------------------------------------------------
// The context/alternatives are Markdown. This is a light cleanup so it reads
// well in a terminal (images can't be shown, so we flag them instead).
function renderText(text) {
    if (!text) return '';
    return text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '[imagem — ver em enem.dev]')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\r\n/g, '\n')
        .trim();
}

function printQuestion(q) {
    const langNote = q.language ? ` · idioma: ${q.language}` : '';
    console.log('\n' + '='.repeat(70));
    console.log(`${q.title}  (disciplina: ${q.discipline ?? '—'}${langNote})`);
    console.log('='.repeat(70));

    const context = renderText(q.context);
    if (context) console.log('\n' + context);

    if (q.files?.length) {
        console.log(`\n[Esta questão tem ${q.files.length} imagem(ns) — veja em https://enem.dev]`);
    }

    const intro = renderText(q.alternativesIntroduction);
    if (intro) console.log('\n' + intro);

    console.log('');
    for (const alt of q.alternatives) {
        const text = alt.text ? renderText(alt.text) : (alt.file ? '[imagem]' : '(sem texto)');
        console.log(`  ${alt.letter}) ${text}`);
    }
}

// ---- one round -------------------------------------------------------------
async function playRound(rl, filters) {
    // 1. Pick a year (respect --year filter if given).
    const year = filters.year ?? pickRandom(await getYears());

    // 2. Pull the question list for that year and optionally filter by discipline.
    let stubs = await getQuestionStubs(year);
    if (filters.discipline) {
        const filtered = stubs.filter(s => s.discipline === filters.discipline);
        if (filtered.length === 0) {
            throw new Error(`No questions for discipline "${filters.discipline}" in ${year}.`);
        }
        stubs = filtered;
    }

    // 3. Pick a random question and fetch its full details.
    const stub = pickRandom(stubs);
    const question = await getQuestion(year, stub.index, stub.language);

    printQuestion(question);

    // 4. Ask the user until we get a valid letter (or quit).
    let answer;
    while (true) {
        const line = await ask(rl, '\nSua resposta (A-E, ou Q para sair): ');
        if (line === null) return { quit: true }; // stdin closed
        const raw = line.trim().toUpperCase();
        if (raw === 'Q') return { quit: true };
        if (LETTERS.includes(raw)) {
            answer = raw;
            break;
        }
        console.log('Entrada inválida. Digite A, B, C, D, E ou Q.');
    }

    // 5. Validate.
    const correct = question.correctAlternative;
    const isCorrect = answer === correct;
    console.log(
        isCorrect
            ? `\n✅ Correto! A resposta é ${correct}.`
            : `\n❌ Errado. Você respondeu ${answer}, mas a correta é ${correct}.`,
    );

    return { quit: false, isCorrect };
}

// ---- main loop -------------------------------------------------------------
async function main() {
    const args = parseArgs(process.argv.slice(2));

    // Resolve qual API usar (a flag vence a variável de ambiente).
    if (args.api) API_BASE = args.api;
    else if (args.local) API_BASE = LOCAL_API;

    const filters = {
        year: args.year,
        discipline: args.discipline,
    };
    const maxCount = args.count ? Number(args.count) : Infinity;

    console.log(' ENEM Quiz — questões aleatórias da API enem.dev');
    console.log(`API: ${API_BASE}`);
    if (filters.year) console.log(`Ano: ${filters.year}`);
    if (filters.discipline) console.log(`Disciplina: ${filters.discipline}`);

    const rl = readline.createInterface({ input, output });
    let asked = 0;
    let score = 0;

    try {
        while (asked < maxCount) {
            let result;
            try {
                result = await playRound(rl, filters);
            } catch (err) {
                console.error(`\n⚠️  ${err.message}`);
                break;
            }

            if (result.quit) break;
            asked++;
            if (result.isCorrect) score++;

            if (asked >= maxCount) break;
            const again = await ask(rl, '\nPróxima questão? (Enter = sim, Q = sair): ');
            if (again === null || again.trim().toUpperCase() === 'Q') break;
        }
    } finally {
        rl.close();
    }

    if (asked > 0) {
        const pct = Math.round((score / asked) * 100);
        console.log(`\n📊 Placar final: ${score}/${asked} corretas (${pct}%).`);
    }
    console.log('Até a próxima!');
}

main().catch(err => {
    console.error(`Fatal: ${err.message}`);
    process.exit(1);
});
