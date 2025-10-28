FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos do front
COPY ./public/html /usr/share/nginx/html
COPY ./public/assets /usr/share/nginx/html/assets
COPY ./public/css /usr/share/nginx/html/css
COPY ./public/js /usr/share/nginx/html/js

# Cria um link simbólico para o login.html ser servido como página inicial
RUN ln -sf /usr/share/nginx/html/login.html /usr/share/nginx/html/index.html

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
