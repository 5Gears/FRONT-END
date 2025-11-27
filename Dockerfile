FROM nginx:alpine

# Limpa o diretório
RUN rm -rf /usr/share/nginx/html/*

# Copia o front compilado
COPY ./public /usr/share/nginx/html

# Copia o entrypoint customizado
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# REMOVE symlink — ele era o problema!

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
