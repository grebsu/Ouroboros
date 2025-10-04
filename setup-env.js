const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- 1. Setup do Diretório de Dados ---
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Diretório "data" criado.');
}

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, '[]', 'utf8');
  console.log('Arquivo "users.json" criado.');
}

// --- 2. Setup das Variáveis de Ambiente ---
const envFilePath = path.join(__dirname, '.env.local');

// Gera a chave secreta
const secret = crypto.randomBytes(32).toString('hex');

let envFileContent = '';

// Verifica se o .env.local existe
if (fs.existsSync(envFilePath)) {
  envFileContent = fs.readFileSync(envFilePath, 'utf8');
}

// Remove linhas antigas para evitar duplicatas
const lines = envFileContent.split('\n');
const newLines = lines.filter(line => 
  !line.startsWith('NEXTAUTH_SECRET=') && 
  !line.startsWith('NEXTAUTH_URL=')
);

// Adiciona as variáveis atualizadas
newLines.push(`NEXTAUTH_SECRET=${secret}`);
newLines.push('NEXTAUTH_URL=http://localhost:3000');

fs.writeFileSync(envFilePath, newLines.join('\n').trim());

console.log('Arquivo .env.local configurado com NEXTAUTH_SECRET e NEXTAUTH_URL.');
console.log('Setup completo! O ambiente está pronto.');