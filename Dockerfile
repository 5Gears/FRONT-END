# Usa imagem leve do Nginx
FROM nginx:alpine

# Limpa o diretório padrão
RUN rm -rf /usr/share/nginx/html/*

# Copia todo o conteúdo do front
COPY ./public /usr/share/nginx/html

# Copia o entrypoint customizado
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Cria link simbólico para redirecionar / → login.html
RUN ln -sf /usr/share/nginx/html/login.html /usr/share/nginx/html/index.html

# Expõe a porta padrão
EXPOSE 80

# Usa o entrypoint que injeta a variável no env.js
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
