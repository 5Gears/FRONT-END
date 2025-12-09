#!/bin/sh
set -e

# Caminho do JS de configuração dentro do contêiner
ENV_FILE="/usr/share/nginx/html/js/env.js"
ENV_DIR=$(dirname "$ENV_FILE")

# CRÍTICO: Garante que o diretório /js exista antes de tentar criar o arquivo
mkdir -p "$ENV_DIR" 

# Gera dinamicamente o arquivo JS com a variável de ambiente
echo "window.ENV = {" > $ENV_FILE
echo "  API_BASE_URL: \"${API_URL:-http://localhost:8080}\"" >> $ENV_FILE
echo "};" >> $ENV_FILE

echo "[INFO] Arquivo env.js criado com API_BASE_URL=${API_URL:-http://localhost:8080}"

# Inicia o Nginx normalmente
exec "$@"