# ENEM Quiz — Aplicação web (Etapa 1)

- **`api/`** — backend em **NestJS** (controller / service / repository).
- **`web/`** — front-end em **React** (Vite).

## Pré-requisitos

1. A **enem-api** rodando localmente (fonte das questões). No repositório `enem-api`:
   ```bash
   npm run dev
   ```
   Sobe em `http://localhost:3000`. Se subir em outra porta, ajuste `ENEM_API_BASE` no `.env` do backend.
2. Node.js 18+.

## Backend (`api/`)

```bash
cd apps/api
cp .env.example .env    
npm install              
npm run start:dev        # http://localhost:3333
```

Endpoints:
- `GET /questions/random` — sorteia uma questão (sem o gabarito). Aceita `?exclude=id1,id2` para não repetir as já vistas.
- `POST /questions/answer` — body `{ year, index, language, choice }`; valida no servidor e retorna `{ correct, correctAlternative }`.

## Front (`web/`)

```bash
cd apps/web
npm install             
npm run dev              # http://localhost:5173
```

O Vite encaminha `/api/*` para o backend (`http://localhost:3333`)
