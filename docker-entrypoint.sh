#!/bin/sh
set -e

# Caminho do JS de configuração
ENV_FILE="/usr/share/nginx/html/js/env.js"

# Gera dinamicamente o arquivo JS com a variável de ambiente
echo "window.ENV = {" > $ENV_FILE
echo "  API_BASE_URL: \"${API_URL:-http://localhost:8080}\"" >> $ENV_FILE
echo "};" >> $ENV_FILE

echo "[INFO] Arquivo env.js criado com API_BASE_URL=${API_URL:-http://localhost:8080}"

# Inicia o Nginx normalmente
exec "$@"
