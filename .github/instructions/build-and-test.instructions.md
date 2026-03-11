---
applyTo: "**"
---

# Script de Build e Testes

Sempre que solicitado para buildar o projeto ou rodar testes, execute os passos abaixo **na ordem exata** e **não pule nenhum passo**.

## Passos

### 1. Lint
```bash
npm run lint
```
- Se houver erros de lint, corrija-os antes de continuar.

### 2. Build
```bash
npm run build
```
- Se o build falhar, analise os erros de compilação TypeScript, corrija-os e repita o build até passar.

### 3. Testes
```bash
npm test
```
- Se algum teste falhar:
  1. Leia a mensagem de erro completa.
  2. Identifique se o problema está no código da implementação ou no próprio teste.
  3. Corrija o código.
  4. Rode `npm test` novamente.
  5. Repita até **todos os testes passarem** (0 failed).

### 4. Cobertura (opcional, quando solicitado)
```bash
npm run test:cov
```
- Verifique se a cobertura está aceitável e informe o resultado ao usuário.

## Critério de sucesso
O processo só está concluído quando:
- `npm run lint` → sem erros
- `npm run build` → sem erros
- `npm test` → **0 failed**, todos os test suites passando
