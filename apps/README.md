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
cp .env.example .env     # ajuste ENEM_API_BASE se necessário
npm install
npm run start:dev        # http://localhost:3333
```

Endpoints:
- `GET /daily` — questão do dia (sem o gabarito).
- `POST /daily/answer` — body `{ deviceToken, year, index, language, choice }`; valida no servidor e retorna `{ correct, correctAlternative, streak, alreadyAnswered }`.

## Front (`web/`)

```bash
cd apps/web
npm install
npm run dev              # http://localhost:5173
```

O Vite encaminha `/api/*` para o backend (`http://localhost:3333`), evitando CORS.

## Estado e próximos passos

Funciona nesta etapa: seleção diária determinística (por data), validação server-side com gabarito oculto, uma resposta por dia e streak. A identidade é anônima (um `deviceToken` no `localStorage`), pois o login (OAuth) é da Etapa 2.

Próximo passo (persistência com **Postgres nativo + TypeORM**):
- adicionar `TypeOrmModule` no `AppModule` e um `DataSource`;
- criar as entidades `users`, `answers`, `daily_challenges` e `questions`;
- implementar o `AnswersRepository` com TypeORM;
- ingestão do índice `questions` (com flags de imagem) para a seleção diária com curadoria.
