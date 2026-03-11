# Rethread Backend

API backend do **Rethread** — plataforma de brechó online que conecta vendedores e compradores de roupas de segunda mão.

## Sobre o projeto

O Rethread permite que usuários cadastrem produtos (roupas, acessórios) com fotos, preço e descrição, e os disponibilizem para compra. A plataforma oferece:

- Autenticação segura via AWS Cognito (cadastro, login, recuperação de senha)
- Cadastro e gerenciamento de produtos com upload de imagens para AWS S3
- Listagem paginada de produtos com filtros
- Soft delete para preservar histórico de vendas

## Tecnologias

- **NestJS 11** + TypeScript
- **PostgreSQL** + TypeORM
- **AWS Cognito** (autenticação)
- **AWS S3** (upload de imagens)
- **Swagger** (documentação da API)
- **Docker** + Docker Compose

## Pré-requisitos

- Node.js 22+ (para rodar localmente sem Docker)
- Docker e Docker Compose (para rodar com container)
- Conta AWS com Cognito e S3 configurados

## Variáveis de ambiente

Copie .env.example para .env e preencha os valores:

`ash
cp .env.example .env
`

## Executando com Docker Compose

A forma mais simples de rodar o projeto. Sobe a API e o banco PostgreSQL juntos:

`ash
docker compose up --build
`

A API estará disponível em http://localhost:3001.

Para rodar em background:

`ash
docker compose up -d --build
`

Para parar:

`ash
docker compose down
`

## Executando localmente (sem Docker)

`ash
npm install
npm run start:dev
`

Requer PostgreSQL rodando localmente com as configurações do .env.

## Documentação da API

Acesse http://localhost:3001/docs após subir o servidor.

A rota é protegida por senha — use o valor definido em SWAGGER_PASSWORD.

## Testes

`ash
npm test
`
