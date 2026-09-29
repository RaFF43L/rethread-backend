#!/bin/bash
# Init hook do LocalStack (executado quando o runtime está pronto).
# Cria o bucket S3 usado em desenvolvimento e, se a licença do LocalStack
# incluir o Cognito (Pro/Enterprise), também cria o user pool e o app client.
# Os valores gerados são gravados em /output/.env.localstack (montado em
# localstack/output/) e carregados pela API via docker compose.
set -euo pipefail

BUCKET_NAME="${AWS_BUCKET_NAME:-rethread-images}"
POOL_NAME="rethread-local"
CLIENT_NAME="rethread-local-client"
OUTPUT_FILE="/output/.env.localstack"

echo "==> [localstack-init] Configurando S3 e Cognito locais"

# --- S3 ---------------------------------------------------------------------
if awslocal s3 ls "s3://${BUCKET_NAME}" >/dev/null 2>&1; then
  echo "    bucket '${BUCKET_NAME}' já existe"
else
  awslocal s3 mb "s3://${BUCKET_NAME}"
  echo "    bucket '${BUCKET_NAME}' criado"
fi

# --- Cognito (requer LocalStack Pro/Enterprise; Community não inclui) --------
USER_POOL_ID=""
CLIENT_ID=""
CLIENT_SECRET=""

if awslocal cognito-idp list-user-pools --max-results 1 >/dev/null 2>&1; then
  # Reutiliza o user pool existente, se houver
  USER_POOL_ID=$(awslocal cognito-idp list-user-pools --max-results 10 \
    --query "UserPools[?Name=='${POOL_NAME}'].Id" --output text | awk '{print $1}')

  if [ -z "${USER_POOL_ID}" ]; then
    USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
      --pool-name "${POOL_NAME}" \
      --query 'UserPool.Id' --output text)
    echo "    user pool '${POOL_NAME}' criado (${USER_POOL_ID})"
  else
    echo "    user pool '${POOL_NAME}' já existe (${USER_POOL_ID})"
  fi

  CLIENT_ID=$(awslocal cognito-idp list-user-pool-clients --user-pool-id "${USER_POOL_ID}" \
    --query "UserPoolClients[?ClientName=='${CLIENT_NAME}'].ClientId" --output text | awk '{print $1}')

  if [ -z "${CLIENT_ID}" ]; then
    CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
      --user-pool-id "${USER_POOL_ID}" \
      --client-name "${CLIENT_NAME}" \
      --generate-secret \
      --query 'UserPoolClient.ClientId' --output text)
    echo "    app client '${CLIENT_NAME}' criado (${CLIENT_ID})"
  else
    echo "    app client '${CLIENT_NAME}' já existe (${CLIENT_ID})"
  fi

  CLIENT_SECRET=$(awslocal cognito-idp describe-user-pool-client \
    --user-pool-id "${USER_POOL_ID}" \
    --client-id "${CLIENT_ID}" \
    --query 'UserPoolClient.ClientSecret' --output text)
else
  echo "    [aviso] cognito-idp não está disponível nesta licença do LocalStack (Community)."
  echo "    Para o Cognito, use AWS real ou LocalStack Pro (defina LOCALSTACK_API_KEY)."
fi

# --- Saída ------------------------------------------------------------------
cat > "${OUTPUT_FILE}" <<EOF
# Gerado pelo LocalStack em $(date -u +%Y-%m-%dT%H:%M:%SZ)
AWS_BUCKET_NAME=${BUCKET_NAME}
EOF

if [ -n "${USER_POOL_ID}" ]; then
  cat >> "${OUTPUT_FILE}" <<EOF
COGNITO_USER_POOL_ID=${USER_POOL_ID}
COGNITO_CLIENT_ID=${CLIENT_ID}
COGNITO_CLIENT_SECRET=${CLIENT_SECRET}
EOF
fi

echo ""
echo "============================================================"
echo " LocalStack pronto! Valores para o seu .env:"
echo "------------------------------------------------------------"
cat "${OUTPUT_FILE}"
echo "============================================================"
