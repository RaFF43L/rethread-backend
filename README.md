# Rethread Backend

API backend do Rethread — marketplace de roupas de segunda mão.

## Tecnologias

- **NestJS 11** + TypeScript
- **PostgreSQL** + TypeORM
- **AWS Cognito** (autenticação)
- **AWS S3** (upload de imagens)
- **Swagger** (documentação da API)

## Pré-requisitos

- Node.js 22+
- PostgreSQL (ou Docker)
- Conta AWS (Cognito + S3)

## Variáveis de ambiente

Copie .env.example para .env e preencha os valores:

\ash
cp .env.example .env
\\n
## Executando localmente

\ash
npm install
npm run start:dev
\\n
## Executando com Docker Compose

\ash
docker compose up --build
\\n
Isso sobe o banco PostgreSQL e a API na porta À1.

## Documentação da API

Acesse http://localhost:3001/docs após subir o servidor.

A rota é protegida por senha — use o valor definido em SWAGGER_PASSWORD.

## Testes

\ash
npm test
\\n