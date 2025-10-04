import fs from 'fs/promises';
import path from 'path';

// Função para obter o caminho correto do arquivo de usuários
function getUsersFilePath() {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    return path.join(dataDir, 'users.json');
}

export interface User {
  id: string;
  username: string;
  password: string; // Hashed password
}

async function ensureUsersFileExists() {
  const usersFile = getUsersFilePath();
  try {
    await fs.access(usersFile);
  } catch (error) {
    // Garante que o diretório exista antes de tentar criar o arquivo
    await fs.mkdir(path.dirname(usersFile), { recursive: true });
    // Se o arquivo não existir, cria com um array vazio
    await fs.writeFile(usersFile, JSON.stringify([]), 'utf-8');
  }
}

export async function getUsers(): Promise<User[]> {
  await ensureUsersFileExists();
  const usersFile = getUsersFilePath();
  const fileContent = await fs.readFile(usersFile, 'utf-8');
  return JSON.parse(fileContent);
}

export async function saveUsers(users: User[]): Promise<void> {
  const usersFile = getUsersFilePath();
  // Garante que o diretório exista antes de salvar
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf-8');
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(user => user.username === username);
}

export async function createUser(username: string, hashedPassword: string): Promise<User> {
  const users = await getUsers();
  const newUser: User = {
    id: Date.now().toString(), // Simple unique ID
    username,
    password: hashedPassword,
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}
