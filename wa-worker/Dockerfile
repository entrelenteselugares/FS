FROM node:20-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./
COPY tsconfig.json ./

# Instala todas as dependências
RUN npm install

# Copia o código fonte do worker
COPY . .

# Faz o build (transpila TypeScript para JS na pasta dist)
RUN npm run build

# Expõe a porta do worker (padrão 3005)
EXPOSE 3005

# Comando para iniciar o servidor
CMD ["npm", "start"]
