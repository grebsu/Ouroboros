# Ouroboros

[![GitHub license](https://img.shields.io/github/license/grebsu/Ouroboros.svg)](https://github.com/grebsu/Ouroboros/blob/master/LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/version/grebsu/Ouroboros)](https://github.com/grebsu/Ouroboros/blob/master/package.json)
<!-- Adicione mais badges aqui, ex: status de build -->

O Ouroboros é uma aplicação completa para planejamento de estudos, projetada para ajudar estudantes a organizar seus horários, acompanhar o progresso e gerenciar revisões de forma eficaz.

## 📖 Sumário
- [🎥 Demonstração em Vídeo](#-demonstração-em-vídeo)
- [✨ Funcionalidades](#-funcionalidades)
- [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [🏁 Como Começar](#-como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Executando a Aplicação](#executando-a-aplicação)
    - [Modo de Desenvolvimento](#modo-de-desenvolvimento)
    - [Modo de Produção com Docker](#modo-de-produção-com-docker)
    - [Executando com Imagem Pré-construída do Docker Hub](#executando-com-imagem-pré-construída-do-docker-hub)
    - [Construindo e Executando a Versão Desktop (Electron)](#construindo-e-executando-a-versão-desktop-electron)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)
- [📞 Contato](#-contato)

## 🎥 Demonstração em Vídeo

Assista a uma breve introdução da aplicação e suas funcionalidades no vídeo abaixo:

**[➡️ Assistir à introdução no YouTube](https://youtu.be/nKAGOVKF7A8?si=D0Oa3fFRNpJWIz3W)**

## 📥 Download

A versão mais recente da aplicação para desktop (Windows e Linux) pode ser baixada aqui:

**[➡️ Baixar Ouroboros v1.1.0](https://drive.google.com/drive/folders/11sRwz3AJHYYy7S5gK6Up_3oEkFQSHd0J?usp=sharing)**

## ✨ Funcionalidades

- **Planejamento de Estudos por Ciclos:** Crie e gerencie ciclos de estudo com base em editais ou objetivos específicos.
- **Registro de Sessões:** Registre sessões de estudo para diferentes matérias, monitorando o tempo e o conteúdo estudado.
- **Estatísticas de Desempenho:** Visualize sua distribuição de estudos e desempenho com gráficos dinâmicos (progresso semanal, horas por matéria, etc.).
- **Gerenciamento de Revisões:** Agende e acompanhe revisões para garantir a retenção do conteúdo a longo prazo.
- **Acompanhamento de Simulados:** Registre os resultados dos simulados para monitorar sua evolução.
- **Cronômetro Integrado:** Utilize um cronômetro para marcar o tempo de estudo com precisão.
- **Matérias e Tópicos Personalizáveis:** Adicione suas próprias matérias e tópicos para adaptar o planejador às suas necessidades.
- **Modo Claro e Escuro:** Alterne entre temas para uma visualização mais confortável.
- **Interface com Drag-and-Drop:** Reordene e gerencie facilmente seus itens de estudo.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI:** [Radix UI](https://www.radix-ui.com/) & [Ícones Lucide](https://lucide.dev/)
- **Visualização de Dados:** [Chart.js](https://www.chartjs.org/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)
- **Gerenciamento de Datas:** [date-fns](https://date-fns.org/)
- **Containerização:** [Docker](https://www.docker.com/)

## 🏁 Como Começar

Siga estas instruções para obter uma cópia do projeto e executá-lo em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior recomendada)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/grebsu/Ouroboros.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd Ouroboros
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

### Executando a Aplicação

#### Modo de Desenvolvimento

Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

#### Modo de Produção com Docker

Para executar a aplicação em um contêiner Docker, garantindo um ambiente de produção consistente:

1.  **Construa a imagem Docker:**
    ```bash
    docker compose build
    ```

2.  **Inicie a aplicação:**
    ```bash
    docker compose up -d
    ```
    A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

#### Executando com Imagem Pré-construída do Docker Hub

Para executar a aplicação usando a imagem pré-construída do Docker Hub:

1.  **Puxe a imagem Docker:**
    ```bash
    docker pull ouroboros73/ouroboros:latest
    ```
2.  **Execute o contêiner Docker:**
    Certifique-se de configurar suas variáveis de ambiente (por exemplo, `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) ao executar o contêiner. Você pode passá-las usando a flag `-e`.
    ```bash
    docker run -p 3000:3000 -e DATABASE_URL="your_database_url" -e NEXTAUTH_SECRET="your_nextauth_secret" -e NEXTAUTH_URL="http://localhost:3000" ouroboros73/ouroboros:latest
    ```

#### Construindo e Executando a Versão Desktop (Electron)

Para construir e executar a aplicação como um aplicativo de desktop (Linux, Windows, macOS) usando Electron:

1.  **Instale as dependências do Electron:**
    ```bash
    npm install electron electron-builder --save-dev
    ```
2.  **Inicie o aplicativo Electron em modo de desenvolvimento:**
    ```bash
    npm run dev:electron
    ```
3.  **Construa o aplicativo para produção:**
    ```bash
    npm run build:electron
    ```
    Os pacotes de instalação (ex: `.deb`, `.AppImage` para Linux; `.exe` para Windows) serão gerados na pasta `dist/`.
## 🤝 Contribuição

Contribuições são muito bem-vindas! Se você tiver ideias, sugestões ou quiser reportar um bug, por favor, abra uma issue ou envie um pull request.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Para dúvidas ou suporte, entre em contato com [Grebsu](mailto:glebson.olvr@gmail.com).
