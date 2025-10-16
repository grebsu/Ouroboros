'use server';

import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { EditalTopic, EditalSubject as Subject } from '@/context/DataContext';
import crypto from 'crypto';

export interface StudyRecord {
  id: string;
  date: string;
  subjectId: string; // Novo campo para o ID da matéria
  subject: string; // Manter por enquanto para compatibilidade e exibição
  topic: string;
  studyTime: number;
  questions: { correct: number; total: number };
  pages: { start: number; end: number }[];
  videos: { title: string; start: string; end: string }[];
  notes: string;
  category: string;
  reviewPeriods?: string[];
  teoriaFinalizada: boolean;
  countInPlanning: boolean;
}

export interface ReviewRecord {
  id: string;
  studyRecordId: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'skipped';
  originalDate: string;
  subjectId: string; // Novo campo para o ID da matéria
  subject: string; // Manter por enquanto para compatibilidade e exibição
  topic: string;
  reviewPeriod: string;
  completedDate?: string;
  ignored?: boolean;
}

export interface SimuladoSubject {
  id: string; // ID único da matéria
  subjectName: string; // Nome da matéria
  weight: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  color: string;
}

export interface SimuladoRecord {
  id: string;
  date: string;
  name: string;
  style: string;
  banca: string;
  timeSpent: string;
  subjects: SimuladoSubject[];
  comments: string;
}

export interface PlanData {
  name: string;
  observations: string;
  cargo?: string;
  edital?: string;
  iconUrl?: string;
  subjects: Subject[];
  bancaTopicWeights?: {
    [subjectId: string]: { // Chave agora é o ID da matéria
      [topicText: string]: number;
    };
  };
  records?: StudyRecord[];
  reviewRecords?: ReviewRecord[];
  simuladoRecords?: SimuladoRecord[];
}

export interface StudyCycleData {
  studyCycle: any[] | null;
  studyHours: string;
  weeklyQuestionsGoal: string;
  currentProgressMinutes: number;
  sessionProgressMap: { [key: string]: number };
  reminderNotes: any[];
  studyDays: string[];
}

async function getUserDataDirectory(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error('Usuário não autenticado.');
  }
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const userDir = path.join(dataDir, session.user.id);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

export async function saveStudyCycleToFile(planFileName: string, cycleData: StudyCycleData): Promise<{ success: boolean; error?: string }> {
  if (!planFileName) {
    return { success: false, error: 'Nome do arquivo do plano não fornecido.' };
  }
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, cycleFileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(cycleData, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar o arquivo do ciclo ${cycleFileName}:`, error);
    return { success: false, error: 'Falha ao salvar o ciclo de estudos.' };
  }
}

export async function getStudyCycleFromFile(planFileName: string): Promise<StudyCycleData | null> {
  if (!planFileName) return null;
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, cycleFileName);
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
       console.error(`Erro ao ler o arquivo do ciclo ${cycleFileName}:`, error);
    }
    return null;
  }
}

export async function deleteStudyCycleFile(planFileName: string): Promise<{ success: boolean; error?: string }> {
    if (!planFileName) {
    return { success: false, error: 'Nome do arquivo do plano não fornecido.' };
  }
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, cycleFileName);
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
     if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { success: true };
    }
    console.error(`Erro ao deletar o arquivo do ciclo ${cycleFileName}:`, error);
    return { success: false, error: 'Falha ao deletar o arquivo do ciclo.' };
  }
}

export async function getJsonFiles(): Promise<string[]> {
  const dataDir = await getUserDataDirectory();
  try {
    const files = await fs.readdir(dataDir);
    return files.filter(file => file.endsWith('.json') && !file.endsWith('.cycle.json'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read data directory:', error);
    return [];
  }
}

export async function deleteJsonFile(fileName: string): Promise<void> {
  const dataDir = await getUserDataDirectory();
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted ${fileName}`);
  } catch (error) {
    console.error(`Error deleting file ${fileName}:`, error);
    throw new Error(`Failed to delete plan: ${fileName}`);
  }
}

export async function getJsonContent(fileName: string) {
  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    console.error('getJsonContent called with invalid fileName:', fileName);
    return null;
  }
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return null;
  }
}

export async function saveStudyRecord(fileName: string, record: StudyRecord): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch(() => ({ name: '', observations: '', subjects: [] }));
    if (!planData.records) planData.records = [];
    const existingIndex = planData.records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.records[existingIndex] = record;
    } else {
      planData.records.push(record);
    }
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
  } catch (error) {
    console.error('Error saving study record:', error);
    throw error;
  }
}

export async function getStudyRecords(fileName: string): Promise<StudyRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.records || [];
  } catch (error) {
    console.error('Error reading study records:', error);
    return [];
  }
}

export async function saveReviewRecord(fileName: string, record: ReviewRecord): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    const planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch(() => ({ name: '', observations: '', subjects: [] }));
    if (!planData.reviewRecords) planData.reviewRecords = [];
    const existingIndex = planData.reviewRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.reviewRecords[existingIndex] = record;
    } else {
      planData.reviewRecords.push(record);
    }
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
  } catch (error) {
    console.error('Error saving review record:', error);
    throw error;
  }
}

export async function getReviewRecords(fileName: string): Promise<ReviewRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.reviewRecords || [];
  } catch (error) {
    console.error('Error reading review records:', error);
    return [];
  }
}

export async function saveSimuladoRecord(fileName: string, record: SimuladoRecord): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch(() => ({ name: '', observations: '', subjects: [] }));
    if (!planData.simuladoRecords) planData.simuladoRecords = [];
    const existingIndex = planData.simuladoRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.simuladoRecords[existingIndex] = record;
    } else {
      planData.simuladoRecords.push(record);
    }
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
  } catch (error) {
    console.error('Error saving simulado record:', error);
    throw error;
  }
}

export async function getSimuladoRecords(fileName: string): Promise<SimuladoRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.simuladoRecords || [];
  } catch (error) {
    console.error('Error reading simulado records:', error);
    return [];
  }
}

export async function migrateStudyRecordIds(fileName: string) {
  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, fileName);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    if (!data || !Array.isArray(data.records)) return { success: true, migrated: false };
    let recordsChanged = false;
    const updatedRecords = data.records.map((record: any) => {
      if (!record.id) {
        recordsChanged = true;
        return { ...record, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-migrated` };
      }
      return record;
    });
    if (recordsChanged) {
      data.records = updatedRecords;
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    return { success: true, migrated: false };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { success: true, migrated: false };
    console.error(`Error migrating IDs for ${fileName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteStudyRecordAction(fileName: string, recordId: string): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    let planData: PlanData | null = await getJsonContent(fileName);
    if (planData && planData.records) {
      const initialLength = planData.records.length;
      planData.records = planData.records.filter(r => r.id !== recordId);
      if (planData.records.length < initialLength) {
        if (planData.reviewRecords) {
          planData.reviewRecords = planData.reviewRecords.filter(rr => rr.studyRecordId !== recordId);
        }
        await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error deleting study record:', error);
    throw error;
  }
}

export async function createPlanFile(formData: FormData): Promise<{ success: boolean; fileName?: string; error?: string }> {
  const planName = formData.get('name') as string;
  const observations = formData.get('observations') as string;
  const cargo = (formData.get('cargo') as string) || '';
  const edital = (formData.get('edital') as string) || '';
  const imageFile = formData.get('image') as File;
  if (!planName || planName.trim() === '') return { success: false, error: 'O nome do plano não pode estar vazio.' };
  const sanitizedPlanName = planName.trim().toLowerCase().replace(/\s+/g, '-');
  const jsonFileName = `${sanitizedPlanName}.json`;
  const userDir = await getUserDataDirectory();
  const jsonFilePath = path.join(userDir, jsonFileName);
  try {
    await fs.access(jsonFilePath);
    return { success: false, error: `O plano '${planName}' já existe.` };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.error('Erro ao verificar arquivo existente:', error);
      return { success: false, error: 'Erro interno do servidor.' };
    }
  }
  let iconUrl: string | undefined = undefined;
  if (imageFile && imageFile.size > 0) {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      iconUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Erro ao converter imagem para Base64:', error);
      return { success: false, error: 'Falha ao processar a imagem do plano.' };
    }
  }
  const planContent: PlanData = {
    name: planName.trim(),
    observations: observations.trim(),
    cargo: cargo.trim(),
    edital: edital.trim(),
    iconUrl: iconUrl,
    subjects: [],
    records: [],
    reviewRecords: [],
  };
  const initialJsonContent = JSON.stringify(planContent, null, 2);
  try {
    await fs.writeFile(jsonFilePath, initialJsonContent, 'utf-8');
    return { success: true, fileName: jsonFileName };
  } catch (error) {
    console.error(`Erro ao criar o arquivo do plano ${jsonFileName}:`, error);
    return { success: false, error: 'Falha ao criar o arquivo do plano.' };
  }
}

export async function updatePlanFile(fileName: string, updatedData: Partial<PlanData>): Promise<{ success: boolean; error?: string }> {
  if (!fileName || fileName.trim() === '') return { success: false, error: 'File name cannot be empty.' };
  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const userDir = await getUserDataDirectory();
  const jsonFilePath = path.join(userDir, jsonFileName);
  try {
    const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
    const currentData: PlanData = JSON.parse(fileContent);
    const newData = { ...currentData, ...updatedData };
    const updatedContent = JSON.stringify(newData, null, 2);
    await fs.writeFile(jsonFilePath, updatedContent, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error(`Error updating plan file ${jsonFileName}:`, error);
    return { success: false, error: 'Failed to update the plan file.' };
  }
}

export async function deletePlanFile(fileName: string): Promise<{ success: boolean; error?: string }> {
  if (!fileName || fileName.trim() === '') return { success: false, error: 'File name cannot be empty.' };
  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const userDir = await getUserDataDirectory();
  const jsonFilePath = path.join(userDir, jsonFileName);
  try {
    await fs.unlink(jsonFilePath);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting plan file ${jsonFileName}:`, error);
    return { success: false, error: 'Failed to delete the plan file.' };
  }
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean; iconUrl?: string; error?: string }> {
  const imageFile = formData.get('imageFile') as File;
  if (!imageFile || imageFile.size === 0) return { success: false, error: 'No image file provided.' };
  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const iconUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
    return { success: true, iconUrl };
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    return { success: false, error: 'Failed to process the image.' };
  }
}

export async function updateSimuladoRecord(fileName: string, record: SimuladoRecord): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch(() => ({ name: '', observations: '', subjects: [] }));
    if (!planData.simuladoRecords) planData.simuladoRecords = [];
    const existingIndex = planData.simuladoRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.simuladoRecords[existingIndex] = record;
    } else {
      planData.simuladoRecords.push(record);
    }
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
  } catch (error) {
    console.error('Error updating simulado record:', error);
    throw error;
  }
}

export async function deleteSimuladoRecordAction(fileName: string, recordId: string): Promise<void> {
  try {
    const dataDir = await getUserDataDirectory();
    const filePath = path.join(dataDir, fileName);
    let planData: PlanData | null = await getJsonContent(fileName);
    if (planData && planData.simuladoRecords) {
      const initialLength = planData.simuladoRecords.length;
      planData.simuladoRecords = planData.simuladoRecords.filter(r => r.id !== recordId);
      if (planData.simuladoRecords.length < initialLength) {
        await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error deleting simulado record:', error);
    throw error;
  }
}

export async function exportFullBackupAction(): Promise<any> {
  const dataDir = await getUserDataDirectory();
  const allFiles = await fs.readdir(dataDir);
  
  const allPlansData = [];
  const allCyclesData = [];

  for (const fileName of allFiles) {
    if (fileName.endsWith('.cycle.json')) {
      const cycleContent = await getJsonContent(fileName);
      if (cycleContent) {
        allCyclesData.push({ fileName: fileName, content: cycleContent });
      }
    } else if (fileName.endsWith('.json') && fileName.toUpperCase() !== 'USERS.JSON') {
      const planContent = await getJsonContent(fileName);
      if (planContent) {
        allPlansData.push({ fileName: fileName, content: planContent });
      }
    }
  }

  return { plans: allPlansData, cycles: allCyclesData };
}

export async function restoreFullBackupAction(backupData: { 
  plans: { fileName: string, content: any }[],
  cycles?: { fileName: string, content: any }[] 
}): Promise<{ success: boolean; error?: string }> {
  const dataDir = await getUserDataDirectory();
  try {
    const existingFiles = await fs.readdir(dataDir);
    for (const file of existingFiles) {
      if (file.endsWith('.json') || file.endsWith('.cycle.json')) {
        await fs.unlink(path.join(dataDir, file));
      }
    }

    if (!backupData.plans || !Array.isArray(backupData.plans)) {
      throw new Error("O backup está faltando a lista de 'planos' ou ela é inválida.");
    }

    for (const plan of backupData.plans) {
      const filePath = path.join(dataDir, plan.fileName);
      await fs.writeFile(filePath, JSON.stringify(plan.content, null, 2), 'utf-8');
    }

    if (backupData.cycles && Array.isArray(backupData.cycles)) {
      for (const cycle of backupData.cycles) {
        const filePath = path.join(dataDir, cycle.fileName);
        await fs.writeFile(filePath, JSON.stringify(cycle.content, null, 2), 'utf-8');
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro durante a restauração do backup:', error);
    return { success: false, error: error.message || 'Falha ao restaurar o backup.' };
  }
}

export async function clearAllDataAction(): Promise<{ success: boolean; error?: string }> {
  const dataDir = await getUserDataDirectory();
  try {
    const existingFiles = await fs.readdir(dataDir);
    for (const file of existingFiles) {
      if (file.endsWith('.json') || file.endsWith('.cycle.json')) {
        await fs.unlink(path.join(dataDir, file));
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error clearing all data:', error);
    return { success: false, error: error.message || 'Failed to clear all data.' };
  }
}

export async function exportAllDataAction(): Promise<any> {
  const dataDir = await getUserDataDirectory();
  const planFiles = await getJsonFiles();
  const allPlansData = [];
  for (const fileName of planFiles) {
    const planContent = await getJsonContent(fileName);
    if (planContent) {
      allPlansData.push({ fileName: fileName, content: planContent });
    }
  }
  return { plans: allPlansData };
}

export async function renameSubjectAction(
  fileName: string,
  subjectId: string,
  newSubjectName: string
): Promise<{ success: boolean; error?: string }> {
  if (!fileName || !subjectId || !newSubjectName) {
    return { success: false, error: 'Parâmetros inválidos para renomear matéria.' };
  }

  const userDir = await getUserDataDirectory();
  const jsonFilePath = path.join(userDir, fileName);
  const cycleFileName = fileName.replace('.json', '.cycle.json');
  const cycleFilePath = path.join(userDir, cycleFileName);

  try {
    // 1. Update the main plan file (.json)
    const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    let oldSubjectName = ''; // Para fins de log e warnings

    // Find the subject by ID and update its name
    planData.subjects = planData.subjects.map(s => {
      if (s.id === subjectId) {
        oldSubjectName = s.subject; // Capture old name for logging
        return { ...s, subject: newSubjectName };
      }
      return s;
    });

    // Update subject in records (using subjectId for matching, newSubjectName for display)
    if (planData.records) {
      planData.records = planData.records.map(r => 
        r.subjectId === subjectId ? { ...r, subject: newSubjectName } : r
      );
    }

    // Update subject in reviewRecords (using subjectId for matching, newSubjectName for display)
    if (planData.reviewRecords) {
      planData.reviewRecords = planData.reviewRecords.map(rr => 
        rr.subjectId === subjectId ? { ...rr, subject: newSubjectName } : rr
      );
    }

    // Update subject in simuladoRecords (using subjectId for matching, newSubjectName for display)
    if (planData.simuladoRecords) {
      planData.simuladoRecords = planData.simuladoRecords.map(sr => ({
        ...sr,
        subjects: sr.subjects.map(ss => 
          ss.id === subjectId ? { ...ss, subjectName: newSubjectName } : ss
        ),
      }));
    }

    // bancaTopicWeights now uses subjectId as key, so no key renaming needed here
    // The values associated with subjectId remain the same.
    // The console.warn for oldSubjectName not found in bancaTopicWeights is no longer relevant
    // as the key is now stable (subjectId).

    await fs.writeFile(jsonFilePath, JSON.stringify(planData, null, 2), 'utf-8');

    // 2. Update the associated cycle file (.cycle.json)
    try {
      const cycleFileContent = await fs.readFile(cycleFilePath, 'utf-8');
      const cycleData: StudyCycleData = JSON.parse(cycleFileContent);

      if (cycleData.studyCycle) {
        cycleData.studyCycle = cycleData.studyCycle.map((session: any) => 
          session.subjectId === subjectId ? { ...session, subject: newSubjectName } : session
        );
      }
      await fs.writeFile(cycleFilePath, JSON.stringify(cycleData, null, 2), 'utf-8');
    } catch (cycleError: any) {
      if (cycleError.code !== 'ENOENT') { // Ignore if cycle file doesn't exist
        console.warn(`Aviso: Não foi possível atualizar o arquivo de ciclo para ${fileName}. Pode não existir.`, cycleError);
      }
    }

    return { success: true, oldSubjectName: oldSubjectName }; // Return old name for notification
  } catch (error: any) {
    console.error(`Erro ao renomear a matéria com ID '${subjectId}' para '${newSubjectName}' no arquivo ${fileName}:`, error);
    return { success: false, error: error.message || 'Falha ao renomear a matéria.' };
  }
}

export async function addOrUpdateSubjectAction(
  fileName: string,
  subjectData: { id?: string; subject: string; topics: EditalTopic[]; color: string }
): Promise<{ success: boolean; error?: string; subjectId?: string }> {
  if (!fileName || !subjectData || !subjectData.subject) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    const existingSubjectIndex = subjectData.id 
      ? planData.subjects.findIndex(s => s.id === subjectData.id) 
      : -1;

    if (existingSubjectIndex !== -1) {
      // Atualizar matéria existente
      planData.subjects[existingSubjectIndex] = { 
        ...planData.subjects[existingSubjectIndex], 
        ...subjectData 
      };
      await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
      return { success: true, subjectId: subjectData.id };
    } else {
      // Adicionar nova matéria
      const newId = crypto.randomUUID();
      const newSubject: Subject = {
        id: newId,
        subject: subjectData.subject,
        color: subjectData.color,
        topics: subjectData.topics,
      };
      planData.subjects.push(newSubject);
      await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
      return { success: true, subjectId: newId };
    }
  } catch (error: any) {
    console.error(`Erro ao salvar a matéria no arquivo ${fileName}:`, error);
    return { success: false, error: error.message || 'Falha ao salvar a matéria.' };
  }
}


export async function updateTopicWeightAction(
  fileName: string,
  subjectId: string,
  topicText: string,
  newWeight: number
): Promise<{ success: boolean; error?: string }> {
  if (!fileName || !subjectId || !topicText || newWeight === undefined) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    const subject = planData.subjects.find(s => s.id === subjectId);
    if (!subject) {
      return { success: false, error: `Matéria com ID '${subjectId}' não encontrada.` };
    }

    const findAndApplyWeight = (topics: EditalTopic[]): boolean => {
      for (const topic of topics) {
        if (topic.topic_text === topicText) {
          topic.userWeight = newWeight;
          return true;
        }
        if (topic.sub_topics && findAndApplyWeight(topic.sub_topics)) {
          return true;
        }
      }
      return false;
    };

    const found = findAndApplyWeight(subject.topics as EditalTopic[]);

    if (!found) {
      return { success: false, error: `Tópico '${topicText}' não encontrado na matéria com ID '${subjectId}'.` };
    }

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar o peso do tópico:', error);
    return { success: false, error: error.message || 'Falha ao atualizar o peso do tópico.' };
  }
}

export async function migrateToSubjectIds(fileName: string): Promise<{ success: boolean; migrated: boolean; error?: string }> {
  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    let needsMigration = false;
    if (!planData.subjects || planData.subjects.some(s => !s.id)) {
      needsMigration = true;
    }
    if (!needsMigration && planData.records?.some(r => !r.subjectId)) {
        needsMigration = true;
    }

    if (!needsMigration) {
      return { success: true, migrated: false };
    }

    console.log(`Migrando arquivo: ${fileName}`);

    const subjectName_to_Id = new Map<string, string>();

    planData.subjects = planData.subjects.map(subject => {
      if (!subject.id) {
        const newId = crypto.randomUUID();
        subjectName_to_Id.set(subject.subject, newId);
        return { ...subject, id: newId };
      } else {
        subjectName_to_Id.set(subject.subject, subject.id);
        return subject;
      }
    });

    if (planData.records) {
      planData.records = planData.records.map(record => {
        if (!record.subjectId && record.subject) {
          const subjectId = subjectName_to_Id.get(record.subject);
          if (subjectId) {
            return { ...record, subjectId };
          }
        }
        return record;
      });
    }

    if (planData.reviewRecords) {
      planData.reviewRecords = planData.reviewRecords.map(review => {
        if (!review.subjectId && review.subject) {
          const subjectId = subjectName_to_Id.get(review.subject);
          if (subjectId) {
            return { ...review, subjectId };
          }
        }
        return review;
      });
    }
    
    if (planData.bancaTopicWeights) {
        const newBancaTopicWeights: PlanData['bancaTopicWeights'] = {};
        for (const subjectName in planData.bancaTopicWeights) {
            const subjectId = subjectName_to_Id.get(subjectName);
            if (subjectId) {
                newBancaTopicWeights[subjectId] = planData.bancaTopicWeights[subjectName];
            }
        }
        planData.bancaTopicWeights = newBancaTopicWeights;
    }

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');

    return { success: true, migrated: true };

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { success: true, migrated: false }; // File doesn't exist, no migration needed
    }
    console.error(`Erro ao migrar para Subject IDs para o arquivo ${fileName}:`, error);
    return { success: false, migrated: false, error: error.message };
  }
}

export async function updateAllTopicWeightsAction(
  fileName: string,
  weightMap: { [subjectId: string]: { [topicText: string]: number } }
): Promise<{ success: boolean; error?: string }> {
  if (!fileName || !weightMap) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const userDir = await getUserDataDirectory();
  const filePath = path.join(userDir, fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    for (const subjectId in weightMap) {
      const subject = planData.subjects.find(s => s.id === subjectId);
      if (subject) {
        const topicWeightsForSubject = weightMap[subjectId];
        const findAndApplyWeight = (topics: EditalTopic[]) => {
          for (const topic of topics) {
            if (topicWeightsForSubject[topic.topic_text] !== undefined) {
              topic.userWeight = topicWeightsForSubject[topic.topic_text];
            }
            if (topic.sub_topics) {
              findAndApplyWeight(topic.sub_topics);
            }
          }
        };
        findAndApplyWeight(subject.topics as EditalTopic[]);
      }
    }

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar todos os pesos de tópicos:', error);
    return { success: false, error: error.message || 'Falha ao atualizar pesos de tópicos.' };
  }
}
