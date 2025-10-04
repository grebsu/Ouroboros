import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // Importa node-fetch no topo
import crypto from 'crypto'; // Importa a biblioteca crypto para gerar UUIDs

// Interfaces para os dados do plano
interface Topic {
  topic_text: string;
  sub_topics?: Topic[];
  question_count?: number;
  is_grouping_topic?: boolean;
}

interface Subject {
  id: string; // Adiciona um ID único para a matéria
  subject: string;
  color: string;
  topics: Topic[];
  total_topics_count: number;
}

interface PlanData {
  name: string;
  cargo: string;
  edital: string;
  iconUrl?: string; // iconUrl agora é opcional, pois pode não haver imagem
  subjects: Subject[];
  banca?: string;
  bancaTopicWeights?: {
    [subjectId: string]: { // Chave agora é o ID da matéria
      [topicText: string]: number;
    };
  };
}

// Função para criar um nome de arquivo seguro
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/--+/g, '-');
}

// Lógica de getUserDataDirectory duplicada aqui para garantir que funcione no build de produção
async function getImportUserDataDirectory(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error('Usuário não autenticado na função de diretório de dados.');
  }
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const userDir = path.join(dataDir, session.user.id);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

// Função para converter URL de imagem para Base64
async function urlToBase64(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Falha ao baixar imagem da URL: ${url} - Status: ${response.status}`);
      return undefined;
    }
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Erro ao converter URL ${url} para Base64:`, error);
    return undefined;
  }
}

// Função principal da API
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Não autorizado. Faça login para importar um guia.' }, { status: 401 });
  }

  const body = await req.json();
  const { guideUrl } = body;

  if (!guideUrl) {
    return NextResponse.json({ error: 'A URL do guia é obrigatória.' }, { status: 400 });
  }

  let browser;
  try {
    console.log('Iniciando o Puppeteer...');

    let executablePath: string | undefined;
    if (process.env.NODE_ENV === 'production') {
      const resourcesPath = process.resourcesPath;
      const cachePath = path.join(resourcesPath, '.cache', 'puppeteer', 'chrome');
      
      if (process.platform === 'win32') {
        // Caminho para o executável do Chrome no Windows
        // A versão '141.0.7390.54' pode precisar de atualização se a versão do Puppeteer mudar.
        executablePath = path.join(cachePath, 'win64-141.0.7390.54', 'chrome-win64', 'chrome.exe');
      } else {
        // Caminho para o executável do Chrome no Linux
        executablePath = path.join(cachePath, 'linux-141.0.7390.54', 'chrome-linux64', 'chrome');
      }
      console.log(`Caminho do executável Puppeteer (produção - ${process.platform}):`, executablePath);
    } else {
      // Em desenvolvimento, o Puppeteer encontra seu próprio executável
      executablePath = puppeteer.executablePath();
      console.log('Caminho do executável Puppeteer (desenvolvimento):', executablePath);
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      executablePath: executablePath,
      dumpio: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`Navegando para: ${guideUrl}`);
    await page.goto(guideUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('div.guias-cabecalho, div.cadernos-agrupamento, div.detalhes-cabecalho', { timeout: 30000 });
    console.log('Página do guia carregada.');

    const headerData = await page.evaluate(() => {
        let name = document.querySelector('div.guias-cabecalho-concurso-nome')?.textContent?.trim() || 
                   document.querySelector('div.detalhes-cabecalho-informacoes-texto h1 span:not([class])')?.textContent?.trim() || 
                   document.title.split('-')[0].trim();
        let cargo = document.querySelector('div.guias-cabecalho-concurso-cargo')?.textContent?.trim() || 
                    document.querySelector('div.detalhes-cabecalho-informacoes-orgao')?.textContent?.trim() || '';
        let edital = document.querySelector('div.guias-cabecalho-concurso-edital')?.textContent?.trim() || '';
        let iconUrl = document.querySelector('div.guias-cabecalho-logo img')?.getAttribute('src') || 
                      document.querySelector('div.detalhes-cabecalho-logotipo img')?.getAttribute('src') || 
                      document.querySelector('img[alt*="logotipo"]')?.getAttribute('src') || '';

        let banca = '';
        const bancaLabel = Array.from(document.querySelectorAll('span.detalhes-campos')).find(el => el.textContent?.trim() === 'Banca');
        if (bancaLabel && bancaLabel.nextElementSibling) {
            banca = (bancaLabel.nextElementSibling as HTMLElement).textContent?.split('(')[0].trim() || '';
        }

        return { name, cargo, edital, iconUrl, banca };
    });

    // CONVERTE A URL DO ÍCONE PARA BASE64 AQUI
    const base64IconUrl = await urlToBase64(headerData.iconUrl);
    if (base64IconUrl) {
        headerData.iconUrl = base64IconUrl;
    } else {
        // Se não conseguir converter, remove a URL para não tentar carregar uma URL externa
        delete headerData.iconUrl;
    }

    const subjectLinks = await page.evaluate(() => {
        const links = new Map<string, string>();
        let subjectElements = document.querySelectorAll('div.guia-materia-item');
        if (subjectElements.length > 0) {
            subjectElements.forEach(el => {
                const anchor = el.querySelector('h4.guia-materia-item-nome a');
                if (anchor) {
                    const name = anchor.textContent?.trim();
                    const url = (anchor as HTMLAnchorElement).href;
                    if (name && name !== 'Inéditas' && url) {
                        links.set(name, url);
                    }
                }
            });
        } else {
            subjectElements = document.querySelectorAll('div.cadernos-item');
            subjectElements.forEach(el => {
                const nameEl = el.querySelector('span.cadernos-colunas-destaque');
                const anchor = el.querySelector('a.cadernos-ver-detalhes');
                if (nameEl && anchor) {
                    const name = nameEl.textContent?.trim();
                    const url = (anchor as HTMLAnchorElement).href;
                    if (name && name !== 'Inéditas' && url) {
                        links.set(name, url);
                    }
                }
            });
        }
        return Array.from(links.entries());
    });

    console.log(`Encontradas ${subjectLinks.length} matérias. Extraindo tópicos...`);
    const finalSubjects: Subject[] = [];
    const SUBJECT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];
    let colorIndex = 0;

    const calculateTotalTopics = (topics: Topic[]): number => {
        return topics.reduce((acc, topic) => 1 + acc + calculateTotalTopics(topic.sub_topics || []), 0);
    };

    const processTopicsFromPage = async (): Promise<Topic[]> => {
        await page.waitForSelector('div.caderno-guia-arvore-indice ul', { timeout: 30000 });
        return page.evaluate(() => {
            const processLis = (ulElement: Element): Topic[] => {
                const topics: Topic[] = [];
                Array.from(ulElement.children).forEach(child => {
                    if (child.tagName !== 'LI') return;
                    const span = child.querySelector(':scope > span');
                    const topicText = span?.textContent?.trim();
                    if (!topicText) return;
                    const questionCountEl = child.querySelector('span.capitulo-questoes > span');
                    let questionCount = 0;
                    if (questionCountEl) {
                        const text = questionCountEl.textContent?.trim().toLowerCase();
                        if (text === 'uma questão') questionCount = 1;
                        else if (text) {
                            const match = text.match(/(\d+)/);
                            if (match) questionCount = parseInt(match[1], 10);
                        }
                    }
                    const subUl = child.nextElementSibling;
                    if (subUl && subUl.tagName === 'UL') {
                        const firstSubLi = subUl.querySelector(':scope > li');
                        if (firstSubLi) {
                            const firstSubQuestionCountEl = firstSubLi.querySelector('span.capitulo-questoes > span');
                            let firstSubQuestionCount = 0;
                            if (firstSubQuestionCountEl) {
                                const text = firstSubQuestionCountEl.textContent?.trim().toLowerCase();
                                if (text === 'uma questão') firstSubQuestionCount = 1;
                                else if (text) {
                                    const match = text.match(/(\d+)/);
                                    if (match) firstSubQuestionCount = parseInt(match[1], 10);
                                }
                            }
                            if (questionCount > 0 && questionCount === firstSubQuestionCount) {
                                const promotedTopics = processLis(subUl);
                                topics.push(...promotedTopics);
                                return;
                            }
                        }
                    }
                    const sub_topics = (subUl && subUl.tagName === 'UL') ? processLis(subUl) : [];
                    topics.push({ 
                        topic_text: topicText, 
                        sub_topics, 
                        question_count: questionCount, 
                        is_grouping_topic: sub_topics.length > 0 
                    });
                });
                return topics;
            };
            const mainTreeContainer = document.querySelector('div.caderno-guia-arvore-indice ul');
            if (!mainTreeContainer) return [];
            return processLis(mainTreeContainer);
        });
    };

    if (subjectLinks.length > 0) {
        for (const [subjectName, subjectUrl] of subjectLinks) {
            console.log(`Processando matéria (multi-página): ${subjectName}`);
            await page.goto(subjectUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            const topicsForSubject = await processTopicsFromPage();
            finalSubjects.push({
                id: crypto.randomUUID(), // Gera um ID único para a matéria
                subject: subjectName,
                topics: topicsForSubject,
                total_topics_count: calculateTotalTopics(topicsForSubject),
                color: SUBJECT_COLORS[colorIndex++ % SUBJECT_COLORS.length],
            });
        }
    } else {
        console.log('Nenhum link de matéria encontrado. Tentando extrair árvore de tópicos da página atual (single-page).');
        const topicsTree = await processTopicsFromPage();
        topicsTree.forEach(subjectNode => {
            finalSubjects.push({
                id: crypto.randomUUID(), // Gera um ID único para a matéria
                subject: subjectNode.topic_text,
                topics: subjectNode.sub_topics || [],
                total_topics_count: calculateTotalTopics(subjectNode.sub_topics || []),
                color: SUBJECT_COLORS[colorIndex++ % SUBJECT_COLORS.length],
            });
        });
    }

    const extractTopicWeights = (subjects: Subject[]) => {
        const weights: PlanData['bancaTopicWeights'] = {};
        subjects.forEach(subject => {
            weights[subject.id] = {}; // Usa o ID da matéria como chave
            const traverseTopics = (topics: Topic[]) => {
                topics.forEach(topic => {
                    if (topic.topic_text) {
                        weights[subject.id][topic.topic_text] = topic.question_count || 0;
                    }
                    if (topic.sub_topics && topic.sub_topics.length > 0) {
                        traverseTopics(topic.sub_topics);
                    }
                });
            };
            traverseTopics(subject.topics);
        });
        return weights;
    };

    const bancaTopicWeights = extractTopicWeights(finalSubjects);
    const planData: PlanData = { ...headerData, subjects: finalSubjects, bancaTopicWeights };

    const userDir = await getImportUserDataDirectory(); // Usa a função duplicada
    
    const fileName = `${slugify(planData.name)}.json`;
    const filePath = path.join(userDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
    console.log(`Plano salvo em: ${filePath}`);

    return NextResponse.json({ message: 'Guia importado com sucesso!', plan: planData });

  } catch (error) {
    console.error('Ocorreu um erro no endpoint de importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: `Falha ao importar o guia: ${errorMessage}` }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador Puppeteer fechado.');
    }
  }
}