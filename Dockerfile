FROM nginx:alpine

# Garante que o entrypoint antigo (que não existe mais no alpine) não quebre
SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

# Limpa o diretório HTML
RUN rm -rf /usr/share/nginx/html/*

# Copia o front compilado
COPY ./public /usr/share/nginx/html

# Copia o entrypoint customizado para o local esperado
COPY ./docker-entrypoint.sh /docker-entrypoint.sh

# Converte para formato UNIX (muito importante se você desenvolveu no Windows)
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Garante que o ENTRYPOINT seja o seu
ENTRYPOINT ["/docker-entrypoint.sh"]

# CMD padrão do nginx
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80