# ENEM Quiz — Aplicação web (Etapa 1)

Monorepo simples com dois apps:

- **`api/`** — backend NestJS (estrutura convencional: controller / service / repository).
- **`web/`** — front-end React (Vite).

## Pré-requisitos

1. A **enem-api** rodando localmente (fonte das questões). No repositório `enem-api`:
   ```bash
   node node_modules/next/dist/bin/next dev
   ```
   Sobe em `http://localhost:3000`. Se subir em outra porta, ajuste `ENEM_API_BASE` no `.env` do backend.
2. Node.js 18+.

## Backend (`api/`)

```bash
cd apps/api
cp .env.example .env     
npm install
npm run start:dev       
```

Endpoints:
- `GET /daily` — questão do dia (sem o gabarito).
- `POST /daily/answer` — body `{ deviceToken, year, index, language, choice }`; valida no servidor e retorna `{ correct, correctAlternative, streak, alreadyAnswered }`.
