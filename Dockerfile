# Use a imagem oficial do Node.js como base
FROM node:20-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de manifesto do pacote e instala as dependências
# O uso de wildcards garante que tanto package.json quanto package-lock.json (ou yarn.lock) sejam copiados.
COPY package*.json ./
COPY setup-env.js ./
RUN npm install

# Copia o restante dos arquivos da aplicação
COPY . .

# Constrói a aplicação Next.js
RUN npm run build

# Expõe a porta em que a aplicação Next.js será executada
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start"]
