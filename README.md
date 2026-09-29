# Rethread Backend

> API do **Rethread**, o brechó online de roupas de segunda mão — um backend NestJS organizado por domínio de negócio com DDD + Clean Architecture, para escalar com clareza.

## Recursos

- **Autenticação completa** via AWS Cognito: cadastro, confirmação, login, recuperação e troca de senha
- **Catálogo de produtos**: criação, edição, remoção (soft delete), listagem paginada e filtros por categoria
- **Mídia**: upload de imagens e vídeos para S3, com URLs pré-assinadas (presigned)
- **Vendas**: registrar e reverter vendas, com painel (dashboard) de métricas
- **Segurança**: rate limiting, validação estrita de entrada e erros padronizados
- **Documentação interativa** da API com Swagger
- **Testes** unitários e de integração com Jest

## Arquitetura

A divisão de pastas não é por acaso: o código é organizado por **domínio de negócio** (`src/modules/<modulo>`), e cada módulo segue as camadas da **Clean Architecture** (`domain`, `application`, `infra`, `http`). Essa escolha mantém as regras de negócio isoladas de detalhes como banco de dados, HTTP e provedores AWS — o que torna o código mais fácil de ler, testar e evoluir, e permite escalar o projeto sem que mudanças de infraestrutura vazem para o núcleo do negócio.

- `domain/` — entidades, regras e portas (contratos) do negócio
- `application/` — casos de uso que orquestram as operações
- `infra/` — implementações concretas (TypeORM, Cognito, S3)
- `http/` — rotas, validação e conversão de requisições

Módulos atuais: `auth`, `users`, `products` e `health`. Detalhes em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Stack

- **NestJS 11** + TypeScript
- **PostgreSQL** + TypeORM (com migrations)
- **AWS Cognito** (identidade) e **AWS S3** (mídia)
- **LocalStack** (S3 local em desenvolvimento)
- **Swagger**, **Jest**, **Docker Compose**

## Executando com Docker Compose (recomendado)

Um único comando sobe **API + PostgreSQL + LocalStack** (S3 local):

```bash
docker compose up --build
```

Na primeira execução, o LocalStack cria automaticamente o bucket S3 e grava os valores gerados em `localstack/output/.env.localstack` — a API os carrega sozinha. A API fica em http://localhost:3001 e a documentação em http://localhost:3001/docs.

> **Sobre o Cognito:** a edição Community do LocalStack (gratuita) cobre o S3, mas **não** o serviço Cognito — ele exige a versão Pro/Enterprise. Para autenticação, use credenciais AWS reais no `.env` ou defina `LOCALSTACK_API_KEY` para habilitar o Cognito local (o init cria o user pool automaticamente).

Pré-requisito (uma vez): copie o `.env.example` para `.env` e mantenha as credenciais de teste e o `AWS_ENDPOINT_URL` apontando para o LocalStack:

```bash
cp .env.example .env
```

Para rodar em background:

```bash
docker compose up -d --build
```

Para parar:

```bash
docker compose down
```

> Use `docker compose down -v` para apagar também os dados do Postgres e do LocalStack.
> Se preferir usar AWS real, remova `AWS_ENDPOINT_URL` e `AWS_PUBLIC_URL` do `.env` e preencha as credenciais reais.

## Executando localmente (sem Docker)

```bash
npm install
npm run start:dev
```

Requer PostgreSQL rodando localmente com as configurações do `.env`. Para o S3 local, suba apenas o LocalStack com `docker compose up -d localstack` e use as credenciais de teste.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

As variáveis de AWS Cognito (`COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_USER_POOL_ID`) vêm do seu user pool — em produção, use os valores reais da AWS; com LocalStack Pro, o init gera esses valores no primeiro boot (consulte `docker compose logs localstack` ou `localstack/output/.env.localstack`).

## Documentação da API

Acesse http://localhost:3001/docs após subir o servidor.

A rota é protegida por senha — use o valor definido em `SWAGGER_PASSWORD`.

## Testes

```bash
npm test
```
