FROM nginx:alpine

# Limpa o diretório
RUN rm -rf /usr/share/nginx/html/*

# Copia todo o conteúdo da pasta 'public' (que inclui js, css, assets e HTMLs)
# Assumimos que a pasta 'public' contém a estrutura final do front-end.
COPY ./public /usr/share/nginx/html

# Copia o entrypoint customizado
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]