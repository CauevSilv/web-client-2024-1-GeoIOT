# --- Estágio 1: Build da Aplicação Vue.js ---
# Use uma imagem oficial do Node.js como base. A versão lts-alpine é leve.
FROM node:lts-alpine as build-stage

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o package.json e o package-lock.json (ou yarn.lock)
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante dos arquivos do projeto para o contêiner
COPY . .

# Executa o comando de build para gerar os arquivos estáticos
RUN npm run build

# --- Estágio 2: Servidor de Produção com Nginx ---
# Use uma imagem oficial e leve do Nginx
FROM nginx:stable-alpine as production-stage

# Copia os arquivos estáticos gerados no estágio anterior para o diretório padrão do Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copia o arquivo de configuração customizado do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 para permitir o acesso ao Nginx
EXPOSE 80

# Comando para iniciar o Nginx quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]
