---
applyTo: "**"
---

# Arquitetura do Projeto

## Estrutura de pastas

```
src/
├── common/                        # Tudo que é global e reutilizável entre módulos
│   ├── helpers/                   # Funções utilitárias puras (ex: mapCognitoError)
│   ├── decorators/                # Decorators globais (ex: @CurrentUser)
│   ├── guards/                    # Guards globais (ex: JwtAuthGuard)
│   ├── interceptors/              # Interceptors globais
│   ├── filters/                   # Exception filters globais
│   └── pipes/                     # Pipes globais
│
├── modules/                       # Módulos de domínio da aplicação
│   └── <nome-do-modulo>/
│       ├── dto/                   # Data Transfer Objects do módulo
│       ├── entities/              # Entidades/tipos de domínio do módulo
│       ├── decorators/            # Decorators de rota do módulo (ex: @LoginRoute)
│       ├── __tests__/             # Testes unitários do módulo
│       │   ├── <modulo>.controller.spec.ts
│       │   └── <modulo>.service.spec.ts
│       ├── <modulo>.controller.ts
│       ├── <modulo>.service.ts
│       └── <modulo>.module.ts
│
├── app.module.ts                  # Módulo raiz — importa ConfigModule e todos os módulos
└── main.ts                        # Bootstrap — configura pipes, cors, prefixo global
```

## Regras

### Decorators
- Decorators **globais** (usados em mais de um módulo) → `src/common/decorators/`
- Decorators **de rota do módulo** → `src/modules/<modulo>/decorators/`
- Cada controller deve ter seu arquivo de decorators de rota (ex: `auth-routes.decorator.ts`)
- Os decorators de rota compõem `@Post`, `@HttpCode`, `@UseGuards`, etc. usando `applyDecorators()`
- Objetivo: manter o controller limpo (`@LoginRoute()` ao invés de `@Post('login') @HttpCode(200)`) e facilitar testes de integração

### DTOs
- Sempre dentro de `src/modules/<modulo>/dto/`
- Sempre usar `class-validator` para validação
- Nome no padrão: `<acao>.dto.ts` (ex: `register.dto.ts`, `create-product.dto.ts`)

### Entities
- Representam o modelo de domínio ou o schema do banco
- Sempre dentro de `src/modules/<modulo>/entities/`
- Nome no padrão: `<nome>.entity.ts`

### Common
- Só entra em `common/` o que é **reaproveitado em 2 ou mais módulos**
- Nunca importar de um módulo para outro diretamente — usar `common/` como ponte ou exportar via módulo

### Módulos
- Cada módulo é auto-contido: controller + service + module no mesmo diretório
- O `AppModule` apenas importa os módulos filhos e o `ConfigModule`
- `ConfigModule.forRoot({ isGlobal: true })` garante acesso às variáveis de ambiente em qualquer módulo sem re-importar

### Testes
- Todos os arquivos de teste ficam dentro de `src/modules/<modulo>/__tests__/`
- Mockar dependências externas (AWS SDK, banco) sempre via `jest.mock()` ou `useValue`
- Nunca fazer chamadas reais a serviços externos nos testes unitários

### Naming Convention (TypeScript ↔ Database)
- TypeScript properties always use **camelCase**: `codigoIdentificacao`, `createdAt`, `urlS3`
- Database columns always use **snake_case**: `codigo_identificacao`, `created_at`, `url_s3`
- In TypeORM entities, always specify `name` in `@Column()`, `@CreateDateColumn()`, `@UpdateDateColumn()`, and `@DeleteDateColumn()` decorators when the property name would translate to camelCase
- Single-word properties (e.g., `cor`, `marca`, `status`) do not need `name` since they already match
- `@PrimaryGeneratedColumn()` does not need `name`

### Código geral
- **Todo o código é escrito em inglês**: nomes de variáveis, funções, classes, interfaces, enums, arquivos e comentários
- **Não adicionar comentários óbvios ou desnecessários** — o código deve ser autoexplicativo; comentários só são válidos quando explicam *por que* uma decisão foi tomada, nunca *o que* o código faz
