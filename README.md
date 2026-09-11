# ENEM Quiz

Um quiz de linha de comando que sorteia uma **questão aleatória** da API
[enem.dev](https://enem.dev), exibe para você e valida a sua resposta.

Sem dependências — apenas Node.js 18+ (usa o `fetch` e o `readline` nativos).

## Como executar

```bash
node quiz.js
```

Uma questão aleatória será exibida com as alternativas A–E. Digite uma letra
para responder; o programa informa se você acertou e mantém um placar de
acertos. Digite `Q` em qualquer momento para sair.

## Opções

| Flag | Exemplo | Efeito |
|------|---------|--------|
| `--year` | `--year 2022` | Sorteia apenas questões daquele ano de prova |
| `--discipline` | `--discipline matematica` | Restringe a uma disciplina |
| `--count` | `--count 5` | Faz exatamente N questões e mostra o placar |
| `--local` | `--local` | Usa a API local (`http://localhost:3000/v1`) |
| `--api` | `--api http://localhost:3001/v1` | Usa a API na URL informada |

Disciplinas: `linguagens`, `ciencias-humanas`, `ciencias-natureza`, `matematica`.

```bash
node quiz.js --year 2023 --discipline matematica --count 5
```

## Usando uma API local

Por padrão o quiz usa a API pública (`https://api.enem.dev/v1`). Para usar a sua
própria instância do `enem-api` rodando localmente, use a flag `--local`:

```bash
node quiz.js --local
```

Se a sua API estiver em outra porta, informe a URL com `--api`:

```bash
node quiz.js --api http://localhost:3001/v1
```

A primeira linha impressa mostra qual API está em uso (`API: ...`), então dá
para confirmar rapidamente se está apontando para a local ou para a pública.

A ordem de precedência é: `--api` > `--local` > variável de ambiente
`ENEM_API_BASE` > API pública.

## Observações

- Algumas questões contêm imagens. O terminal não consegue exibi-las, então
  elas aparecem como `[imagem — ver em enem.dev]`. A validação da resposta
  continua funcionando normalmente.
- A API pública tem limite de requisições; em uso intenso você pode receber um
  erro `429`.
