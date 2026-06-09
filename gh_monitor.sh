#!/bin/bash

echo "🔍 Procurando por alguma task em execução no GitHub Actions..."

# 1. BUSCA UMA TASK QUE ESTEJA RODANDO (in_progress) OU NA FILA (queued)
RUN_DATA=$(gh run list --limit 1 --json databaseId,status --jq '.[] | select(.status=="in_progress" or .status=="queued")')

# Se não encontrar nenhuma rodando, tenta pegar a última que foi criada para garantir
if [ -z "$RUN_DATA" ]; then
  echo "⚠️ Nenhuma task rodando agora. Verificando a execução mais recente..."
  RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
else
  RUN_ID=$(echo "$RUN_DATA" | jq '.databaseId')
fi

# Se mesmo assim o repositório não tiver nenhuma task histórica
if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "❌ Nenhuma task foi encontrada neste repositório."
  exit 1
fi

echo "🆔 Task identificada para monitoramento! ID: $RUN_ID"

# 2. LOOP DE MONITORAMENTO (Roda enquanto a task estiver ativa)
STATUS="queued"
while [ "$STATUS" = "queued" ] || [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "requested" ] || [ "$STATUS" = "waiting" ]; do
  
  # Atualiza o status atual da task
  STATUS=$(gh run view "$RUN_ID" --json status --jq '.status')
  
  if [ "$STATUS" = "queued" ] || [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "requested" ] || [ "$STATUS" = "waiting" ]; then
    echo "⏳ A task ainda está rodando (Status: $STATUS)... Aguardando 10 segundos..."
    sleep 10
  fi
done

echo "🏁 A execução terminou!"

# 3. VERIFICA SE DEU ERRO E GERA OS LOGS DE OUTPUT
CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')

if [ "$CONCLUSION" = "failure" ]; then
  LOG_FILE="erro_task_${RUN_ID}.log"
  echo "❌ Erro detectado! Status final: $CONCLUSION"
  echo "📥 Baixando os logs de output para o arquivo: $LOG_FILE"
  
  # Salva o log detalhado no arquivo
  gh run view "$RUN_ID" --log > "$LOG_FILE" [gh-run-view]
  
  echo "📂 Arquivo de log gerado com sucesso. Pronto para análise!"
else
  echo "✅ A task terminou com sucesso (Status: $CONCLUSION). Nenhum log de erro foi gerado."
fi

