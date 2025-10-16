'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getJsonFiles, 
  getStudyRecords, 
  saveStudyRecord, 
  getReviewRecords, 
  saveReviewRecord, 
  deleteStudyRecordAction, 
  getJsonContent, 
  SimuladoRecord, 
  saveSimuladoRecord, 
  updateSimuladoRecord as updateSimuladoRecordAction, 
  deleteSimuladoRecordAction as deleteSimuladoRecordActionImport, 
  getSimuladoRecords,
  exportFullBackupAction,
  restoreFullBackupAction,
  saveStudyCycleToFile,
  getStudyCycleFromFile,
  deleteStudyCycleFile,
  deleteJsonFile,
  updateTopicWeightAction,
  migrateToSubjectIds, // Adicionada a importação da migração
  clearAllDataAction,
  renameSubjectAction,
  addOrUpdateSubjectAction
} from '../app/actions';
import { useNotification } from './NotificationContext';

// --- INTERFACES HIERÁRQUICAS ---
export interface EditalTopic {
  topic_text: string;
  completed: number;
  reviewed: number;
  total: number;
  percentage: number;
  last_study: string;
  is_completed: boolean;
  userWeight?: number;
  is_grouping_topic?: boolean;
  sub_topics?: EditalTopic[];
}

export interface EditalSubject {
  id: string; // Adiciona um ID único para a matéria
  subject: string;
  color: string;
  topics: EditalTopic[];
}
// --- FIM DAS INTERFACES ---

export interface StudyRecord {
  id: string;
  date: string;
  subjectId: string; // ID da matéria para referência estável
  subject: string; // Nome da matéria para exibição
  topic: string;
  studyTime: number;
  questions?: { correct: number; total: number };
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
  subjectId: string; // ID da matéria para referência estável
  subject: string; // Nome da matéria para exibição
  topic: string;
  reviewPeriod: string;
  completedDate?: string;
  ignored?: boolean;
}

interface Filters {
  subject: string;
  category: string;
  startDate: string;
  endDate: string;
}

export interface SubjectPerformance {
  [subject: string]: {
    totalStudyTime: number;
    totalQuestions: number;
    correctQuestions: number;
    incorrectQuestions: number;
    performance: number;
    correctPercentage: number;
    incorrectPercentage: number;
  };
}

export interface TopicPerformanceEntry {
  subject: string;
  topic: string;
  totalStudyTime: number;
  totalQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  performance: number;
  correctPercentage: number;
  incorrectPercentage: number;
}

export type TopicPerformance = TopicPerformanceEntry[];

export interface HierarchicalPerformanceNode {
    id: string;
    name: string;
    acertos: number;
    erros: number;
    naoFeitas: number;
    total: number;
    percentualAcerto: number;
    is_grouping_topic?: boolean;
    children?: HierarchicalPerformanceNode[];
}

export interface ConsistencyData {
  date: string;
  studied: boolean;
  active: boolean;
}

export interface ReminderNote {
  id: string;
  text: string;
  completed: boolean;
}

export interface TopicPerformanceMetrics {
  subjectId: string; // Adicionado para referência estável
  subject: string;
  topic: string;
  hitRate: number;
  totalQuestions: number;
  studyCount: number;
  daysSinceLastStudy: number;
  userWeight: number;
}

export interface TopicScore extends TopicPerformanceMetrics {
  score: number;
  justification: string;
}

export interface StudySession {
  id: any;
  subjectId: string; // ID da matéria
  subject: string; // Manter por enquanto para compatibilidade e exibição
  duration: number;
  color: string;
}

export interface Stats {
  totalCorrectQuestions: number;
  totalQuestions: number;
  dailyStudyTime: { [date: string]: number };
  dailySubjectStudyTime: { [date: string]: { [subject: string]: number } };
  totalStudyTime: number;
  uniqueStudyDays: number;
  totalPagesRead: number;
  pagesPerHour: number;
  totalVideoTime: number;
  totalDaysSinceFirstRecord: number;
  failedStudyDays: number;
  studyConsistencyPercentage: number;
  consecutiveDays: number;
  consistencyData: ConsistencyData[];
  consistencyStartDate: string | null;
  consistencyEndDate: string | null;
  isConsistencyPrevDisabled: boolean;
  isConsistencyNextDisabled: boolean;
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  overallEditalProgress: number;
  dailyQuestionStats: { [date: string]: { correct: number; total: number; incorrect: number } };
  dailyStudyHours: { [date: string]: number };
  subjectStudyHours: { [subject: string]: number };
  categoryStudyHours: { [category: string]: number };
  subjectPerformance: SubjectPerformance;
  topicPerformance: HierarchicalPerformanceNode[];
  editalData: EditalSubject[];
  weeklyHours: number;
  weeklyQuestions: number;
}

const calculateStats = async (
  studyRecords: StudyRecord[],
  selectedDataFile: string,
  activeFilters: Filters,
  studyPlans: any[],
  availablePlans: string[],
  consistencyOffset: number,
  studyDays: string[],
  studyCycle: StudySession[] | null
): Promise<Stats> => {
  let totalCorrectQuestions = 0;
  let totalQuestions = 0;
  const dailyStudyTime: { [date: string]: number } = {};
  const dailySubjectStudyTime: { [date: string]: { [subject: string]: number } } = {};
  let totalStudyTime = 0;
  const uniqueDays = new Set<string>();
  let totalPagesRead = 0;
  let totalVideoTime = 0;
  const dailyQuestionStats: { [date: string]: { correct: number; total: number; incorrect: number } } = {};
  const dailyStudyHours: { [date: string]: number } = {};
  const subjectStudyHours: { [subject: string]: number } = {};
  const categoryStudyHours: { [category: string]: number } = {};
  const subjectPerformance: SubjectPerformance = {};
  const topicPerformanceMap = new Map<string, TopicPerformanceEntry>();
  
  let weeklyHours = 0;
  let weeklyQuestions = 0;
  const todayForWeek = new Date();
  const dayOfWeek = todayForWeek.getDay();
  const firstDayOfWeek = new Date(todayForWeek);
  const diff = todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
  firstDayOfWeek.setDate(diff);
  firstDayOfWeek.setHours(0, 0, 0, 0);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  let editalData: EditalSubject[] = [];
  const currentPlanIndex = availablePlans.indexOf(selectedDataFile);
  const currentPlanData = studyPlans[currentPlanIndex];

  const initializeTopicsRecursively = (topics: any[], parentTopicText: string = ''): EditalTopic[] => {
    return (topics || []).flatMap(topic => {
      let cleanedTopicText = topic.topic_text;
      if (parentTopicText && cleanedTopicText.startsWith(parentTopicText)) {
        cleanedTopicText = cleanedTopicText.substring(parentTopicText.length).trim();
      }
      cleanedTopicText = cleanedTopicText.replace(/^[\s-]*\s*/, '').trim();

      const newTopic: EditalTopic = {
        ...topic,
        topic_text: cleanedTopicText,
        completed: 0,
        reviewed: 0,
        total: 0,
        percentage: 0,
        last_study: '-',
        is_completed: false,
        sub_topics: topic.sub_topics ? initializeTopicsRecursively(topic.sub_topics, topic.topic_text) : [],
      };
      return [newTopic];
    });
  };

  if (currentPlanData) {
    let subjectsToProcess: any[] = [];
    if (Array.isArray(currentPlanData)) {
      subjectsToProcess = currentPlanData;
    } else if (currentPlanData && typeof currentPlanData === 'object' && Array.isArray(currentPlanData.subjects)) {
      subjectsToProcess = currentPlanData.subjects;
    }

    const uniqueSubjectsMap = new Map<string, any>();
    subjectsToProcess.forEach(s => {
        if (s && typeof s === 'object' && s.subject) {
            uniqueSubjectsMap.set(s.subject, s);
        }
    });
    const uniqueSubjects = Array.from(uniqueSubjectsMap.values());

    editalData = uniqueSubjects
      .filter((subject: any) => subject && typeof subject === 'object')
      .map((subject: any) => ({
        id: subject.id,
        subject: subject.subject,
        color: subject.color,
        topics: initializeTopicsRecursively(subject.topics, subject.subject),
      }));
  }

  const subjectIdToNameMap = new Map<string, string>();
  editalData.forEach(s => subjectIdToNameMap.set(s.id, s.subject));

  let filteredStudyRecords = studyRecords;

  if (activeFilters.subject) {
    const subjectId = editalData.find(s => s.subject === activeFilters.subject)?.id;
    if (subjectId) {
      filteredStudyRecords = filteredStudyRecords.filter(record => record.subjectId === subjectId);
    }
  }
  if (activeFilters.category) {
    filteredStudyRecords = filteredStudyRecords.filter(record => record.category === activeFilters.category);
  }
  if (activeFilters.startDate) {
    const startDate = new Date(activeFilters.startDate);
    filteredStudyRecords = filteredStudyRecords.filter(record => new Date(record.date) >= startDate);
  }
  if (activeFilters.endDate) {
    const endDate = new Date(activeFilters.endDate);
    endDate.setDate(endDate.getDate() + 1);
    filteredStudyRecords = filteredStudyRecords.filter(record => new Date(record.date) < endDate);
  }

  filteredStudyRecords.forEach(record => {
    const [year, month, day] = record.date.split('-').map(Number);
    const recordDate = new Date(year, month - 1, day);
    const date = record.date;
    uniqueDays.add(date);

    let correctQs = 0;
    let totalQs = 0;
    if (record.questions && typeof record.questions.total === 'number') {
      correctQs = record.questions.correct || 0;
      totalQs = record.questions.total;
    }
    const incorrectQs = totalQs - correctQs;

    if (recordDate >= firstDayOfWeek && recordDate <= lastDayOfWeek) {
      weeklyHours += record.studyTime || 0;
      weeklyQuestions += totalQs;
    }

    dailyStudyTime[date] = (dailyStudyTime[date] || 0) + (record.studyTime || 0);
    if (!dailySubjectStudyTime[date]) {
      dailySubjectStudyTime[date] = {};
    }
    const subjectName = subjectIdToNameMap.get(record.subjectId) || record.subject;
    dailySubjectStudyTime[date][subjectName] = (dailySubjectStudyTime[date][subjectName] || 0) + (record.studyTime || 0);
    totalStudyTime += record.studyTime || 0;

    totalCorrectQuestions += correctQs;
    totalQuestions += totalQs;
    if (!dailyQuestionStats[date]) {
      dailyQuestionStats[date] = { correct: 0, total: 0, incorrect: 0 };
    }
    dailyQuestionStats[date].correct += correctQs;
    dailyQuestionStats[date].total += totalQs;
    dailyQuestionStats[date].incorrect += incorrectQs;

    if (record.pages) {
      record.pages.forEach(pageRange => {
        if (typeof pageRange === 'object' && 'start' in pageRange && 'end' in pageRange) {
          totalPagesRead += (pageRange.end - pageRange.start + 1);
        }
      });
    }

    if (record.videos) {
      record.videos.forEach(video => {
        const parseTime = (timeStr: string) => {
          const [h, m, s] = timeStr.split(':').map(Number);
          return (h * 3600 + m * 60 + s) * 1000;
        };
        totalVideoTime += (parseTime(video.end) - parseTime(video.start));
      });
    }

    dailyStudyHours[date] = (dailyStudyHours[date] || 0) + (record.studyTime / 3600000);
    subjectStudyHours[subjectName] = (subjectStudyHours[subjectName] || 0) + (record.studyTime / 3600000);
    categoryStudyHours[record.category] = (categoryStudyHours[record.category] || 0) + (record.studyTime / 3600000);

    if (!subjectPerformance[subjectName]) {
      subjectPerformance[subjectName] = {
        totalStudyTime: 0, totalQuestions: 0, correctQuestions: 0, incorrectQuestions: 0,
        performance: 0, correctPercentage: 0, incorrectPercentage: 0,
      };
    }
    subjectPerformance[subjectName].totalStudyTime += record.studyTime;
    if (record.questions) {
      subjectPerformance[subjectName].totalQuestions += record.questions.total;
      subjectPerformance[subjectName].correctQuestions += record.questions.correct;
      subjectPerformance[subjectName].incorrectQuestions += (record.questions.total - record.questions.correct);
    }
    
    const subjectTotalQuestions = subjectPerformance[subjectName].totalQuestions;
    const subjectCorrectQuestions = subjectPerformance[subjectName].correctQuestions;
    const subjectIncorrectQuestions = subjectPerformance[subjectName].incorrectQuestions;

    subjectPerformance[subjectName].correctPercentage = subjectTotalQuestions > 0 ? (subjectCorrectQuestions / subjectTotalQuestions) * 100 : 0;
    subjectPerformance[subjectName].incorrectPercentage = subjectTotalQuestions > 0 ? (subjectIncorrectQuestions / subjectTotalQuestions) * 100 : 0;
    subjectPerformance[subjectName].performance = subjectPerformance[subjectName].correctPercentage;

    const topicKey = `${record.subjectId}-${record.topic}`;
    if (!topicPerformanceMap.has(topicKey)) {
      topicPerformanceMap.set(topicKey, {
        subject: subjectName, topic: record.topic, totalStudyTime: 0, totalQuestions: 0,
        correctQuestions: 0, incorrectQuestions: 0, performance: 0, correctPercentage: 0, incorrectPercentage: 0,
      });
    }
    const currentTopicPerf = topicPerformanceMap.get(topicKey)!;
    currentTopicPerf.totalStudyTime += record.studyTime;
    if (record.questions) {
      currentTopicPerf.totalQuestions += record.questions.total;
      currentTopicPerf.correctQuestions += record.questions.correct;
      currentTopicPerf.incorrectQuestions += (record.questions.total - record.questions.correct);
    }

    const topicTotalQuestions = currentTopicPerf.totalQuestions;
    const topicCorrectQuestions = currentTopicPerf.correctQuestions;
    const topicIncorrectQuestions = currentTopicPerf.incorrectQuestions;

    currentTopicPerf.correctPercentage = topicTotalQuestions > 0 ? (topicCorrectQuestions / topicTotalQuestions) * 100 : 0;
    currentTopicPerf.incorrectPercentage = topicTotalQuestions > 0 ? (topicIncorrectQuestions / topicTotalQuestions) * 100 : 0;
    currentTopicPerf.performance = currentTopicPerf.correctPercentage;
  });

  const processTopicsRecursively = (topics: EditalTopic[], subjectId: string) => {
    topics.forEach(topic => {
      filteredStudyRecords.forEach(record => {
        if (record.subjectId === subjectId && record.topic === topic.topic_text) {
          topic.completed += record.questions?.correct || 0;
          topic.reviewed += (record.questions?.total || 0) - (record.questions?.correct || 0);
          if (record.date > topic.last_study) {
            topic.last_study = record.date;
          }
          if (record.teoriaFinalizada) {
            topic.is_completed = true;
          }
        }
      });
      topic.total = topic.completed + topic.reviewed;
      topic.percentage = topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;

      if (topic.sub_topics && topic.sub_topics.length > 0) {
        processTopicsRecursively(topic.sub_topics, subjectId);
      }
    });
  };

  editalData.forEach(subject => {
    processTopicsRecursively(subject.topics, subject.id);
  });

  const aggregateStatsRecursively = (topic: EditalTopic): { completed: number, total: number, last_study: string, is_completed: boolean } => {
    if (!topic.sub_topics || topic.sub_topics.length === 0) {
      return { completed: topic.completed, total: topic.total, last_study: topic.last_study, is_completed: topic.is_completed };
    }
    let aggregatedCompleted = 0, aggregatedTotal = 0, mostRecentStudy = '-', allChildrenCompleted = true;
    topic.sub_topics.forEach(subTopic => {
      const childStats = aggregateStatsRecursively(subTopic);
      aggregatedCompleted += childStats.completed;
      aggregatedTotal += childStats.total;
      if (childStats.last_study !== '-' && (mostRecentStudy === '-' || new Date(childStats.last_study) > new Date(mostRecentStudy))) {
        mostRecentStudy = childStats.last_study;
      }
      if (!childStats.is_completed) allChildrenCompleted = false;
    });
    topic.completed = aggregatedCompleted;
    topic.total = aggregatedTotal;
    topic.reviewed = aggregatedTotal - aggregatedCompleted;
    topic.percentage = aggregatedTotal > 0 ? Math.round((aggregatedCompleted / aggregatedTotal) * 100) : 0;
    topic.last_study = mostRecentStudy;
    topic.is_completed = allChildrenCompleted;
    return { completed: aggregatedCompleted, total: aggregatedTotal, last_study: mostRecentStudy, is_completed: allChildrenCompleted };
  };

  editalData.forEach(subject => subject.topics.forEach(topic => aggregateStatsRecursively(topic)));

  const countTopicsRecursively = (topics: EditalTopic[]): { total: number, completed: number } => {
    let total = 0, completed = 0;
    for (const topic of topics) {
      if (!topic.sub_topics || topic.sub_topics.length === 0) {
        total++;
        if (topic.is_completed) completed++;
      } else {
        const subCounts = countTopicsRecursively(topic.sub_topics);
        total += subCounts.total;
        completed += subCounts.completed;
      }
    }
    return { total, completed };
  };

  let totalTopics = 0, completedTopics = 0;
  editalData.forEach(subject => {
    const counts = countTopicsRecursively(subject.topics);
    totalTopics += counts.total;
    completedTopics += counts.completed;
  });

  let totalDaysSinceFirstRecord = 0, failedStudyDays = 0, studyConsistencyPercentage = 0;
  const allStudiedDays = new Set(studyRecords.map(r => r.date));

  if (allStudiedDays.size > 0) {
    const sortedDates = Array.from(allStudiedDays).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    const firstDay = sortedDates[0];
    const lastDay = new Date();
    lastDay.setHours(0, 0, 0, 0);
    if (lastDay >= firstDay) {
      totalDaysSinceFirstRecord = Math.ceil((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      let missedStudyDays = 0;
      const dayNameToNum: { [key: string]: number } = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
      const studyDayNums = new Set(studyDays.map(d => dayNameToNum[d]));
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (studyDayNums.has(d.getDay()) && !allStudiedDays.has(dateStr)) missedStudyDays++;
      }
      failedStudyDays = missedStudyDays;
      if (totalDaysSinceFirstRecord > 0) {
        const totalScheduledDays = Array.from({ length: totalDaysSinceFirstRecord }, (_, i) => {
          const d = new Date(firstDay); d.setDate(d.getDate() + i); return d;
        }).filter(d => studyDayNums.has(d.getDay())).length;
        studyConsistencyPercentage = totalScheduledDays > 0 ? (allStudiedDays.size / totalScheduledDays) * 100 : 100;
      }
    }
  }

  const dates = studyRecords.map(r => new Date(r.date));
  const firstStudyDate = dates.length > 0 ? new Date(Math.min.apply(null, dates.map(d => d.getTime()))) : null;
  const today = new Date();
  today.setDate(today.getDate() - (consistencyOffset * 30));
  const consistencyEndDate = new Date(today);
  const consistencyStartDate = new Date(today);
  consistencyStartDate.setDate(today.getDate() - 29);

  const consistencyDaysData: any[] = [];
  let consecutiveDays = 0;
  if (firstStudyDate) {
    const dayNameToNum: { [key: string]: number } = { 'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6 };
    const studyDayNums = new Set(studyDays.map(d => dayNameToNum[d]));
    if (consistencyOffset === 0) {
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        if (d < firstStudyDate) break;
        const dateStr = d.toISOString().split('T')[0];
        if (studyDayNums.has(d.getDay())) {
          if (allStudiedDays.has(dateStr)) consecutiveDays++;
          else break;
        } else consecutiveDays++;
      }
    }
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i); d.setHours(0, 0, 0, 0);
      const isActive = d >= firstStudyDate;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isStudyDay = studyDayNums.has(d.getDay());
      const studied = allStudiedDays.has(dateStr);
      let status = 'inactive';
      if (isActive) status = isStudyDay ? (studied ? 'studied' : 'failed') : 'rest';
      consistencyDaysData.push({ date: dateStr, status, active: isActive });
    }
  }
  const isConsistencyPrevDisabled = !firstStudyDate || consistencyStartDate <= firstStudyDate;
  const isConsistencyNextDisabled = consistencyOffset === 0;

  const processHierarchicalPerformance = (
      topics: EditalTopic[],
      subjectId: string,
      studyRecords: StudyRecord[]
  ): HierarchicalPerformanceNode[] => {
      return topics.map(topic => {
          const isGroupingTopic = topic.is_grouping_topic || (topic.sub_topics && topic.sub_topics.length > 0);
          const childrenPerformanceNodes = topic.sub_topics ? processHierarchicalPerformance(topic.sub_topics, subjectId, studyRecords) : [];
          let acertos = 0, erros = 0, naoFeitas = 0;
          if (isGroupingTopic) {
              childrenPerformanceNodes.forEach(child => {
                  acertos += child.acertos;
                  erros += child.erros;
                  naoFeitas += child.naoFeitas;
              });
          } else {
              studyRecords.filter(record => record.subjectId === subjectId && record.topic === topic.topic_text).forEach(record => {
                  if (record.questions) {
                      acertos += record.questions.correct || 0;
                      erros += (record.questions.total || 0) - (record.questions.correct || 0);
                  }
              });
          }
          const total = acertos + erros + naoFeitas;
          const percentualAcerto = total > 0 ? (acertos / total) * 100 : 0;
          return { id: topic.topic_text, name: topic.topic_text, acertos, erros, naoFeitas, total, percentualAcerto, is_grouping_topic: isGroupingTopic, children: childrenPerformanceNodes.length > 0 ? childrenPerformanceNodes : undefined };
      });
  };

  const hierarchicalTopicPerformance: HierarchicalPerformanceNode[] = editalData.map(subject => {
      const children = processHierarchicalPerformance(subject.topics, subject.id, filteredStudyRecords);
      const countLeaves = (nodes: HierarchicalPerformanceNode[]): { acertos: number, erros: number, naoFeitas: number } => {
        let acertos = 0, erros = 0, naoFeitas = 0;
        nodes.forEach(node => {
          if (!node.children || node.children.length === 0) {
            acertos += node.acertos; erros += node.erros; naoFeitas += node.naoFeitas;
          } else {
            const childSums = countLeaves(node.children);
            acertos += childSums.acertos; erros += childSums.erros; naoFeitas += childSums.naoFeitas;
          }
        });
        return { acertos, erros, naoFeitas };
      };
      const { acertos, erros, naoFeitas } = countLeaves(children);
      const total = acertos + erros + naoFeitas;
      const percentualAcerto = total > 0 ? (acertos / total) * 100 : 0;
      return { id: subject.id, name: subject.subject, acertos, erros, naoFeitas, total, percentualAcerto, children: children.length > 0 ? children : undefined };
  });

  return {
    totalCorrectQuestions, totalQuestions, dailyStudyTime, dailySubjectStudyTime, totalStudyTime,
    uniqueStudyDays: uniqueDays.size, totalPagesRead, pagesPerHour: totalStudyTime > 0 ? (totalPagesRead / (totalStudyTime / 3600000)) : 0,
    totalVideoTime, totalDaysSinceFirstRecord, failedStudyDays, studyConsistencyPercentage, consecutiveDays,
    consistencyData: consistencyDaysData, consistencyStartDate: consistencyStartDate.toISOString(),
    consistencyEndDate: consistencyEndDate.toISOString(), isConsistencyPrevDisabled, isConsistencyNextDisabled,
    totalTopics, completedTopics, pendingTopics: totalTopics - completedTopics,
    overallEditalProgress: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0,
    dailyQuestionStats, dailyStudyHours, subjectStudyHours, categoryStudyHours, subjectPerformance,
    topicPerformance: hierarchicalTopicPerformance, editalData, weeklyHours, weeklyQuestions,
  };
};

interface DataContextType {
  selectedDataFile: string;
  setSelectedDataFile: (fileName: string) => void;
  availablePlans: string[];
  studyPlans: any[];
  studyRecords: StudyRecord[];
  reviewRecords: ReviewRecord[];
  simuladoRecords: SimuladoRecord[];
  stats: Stats;
  addStudyRecord: (record: Omit<StudyRecord, 'id' | 'subjectId'> & { subject: string }) => Promise<void>;
  addSimuladoRecord: (record: Omit<SimuladoRecord, 'id'>) => Promise<void>;
  updateStudyRecord: (record: StudyRecord) => Promise<void>;
  updateSimuladoRecord: (record: SimuladoRecord) => Promise<void>;
  deleteStudyRecord: (id: string) => Promise<void>;
  deleteSimuladoRecord: (id: string) => Promise<void>;
  updateReviewRecord: (record: ReviewRecord) => Promise<void>;
  applyFilters: (filters: Filters) => void;
  handleConsistencyNav: (direction: number) => void;
  studyCycle: StudySession[] | null;
  setStudyCycle: React.Dispatch<React.SetStateAction<StudySession[] | null>>;
  generateStudyCycle: (settings: any) => void;
  resetStudyCycle: () => void;
  loading: boolean;
  sessionProgressMap: { [key: string]: number };
  setSessionProgressMap: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  completedCycles: number;
  setCompletedCycles: React.Dispatch<React.SetStateAction<number>>;
  currentProgressMinutes: number;
  setCurrentProgressMinutes: React.Dispatch<React.SetStateAction<number>>;
  currentStudySession: StudySession | null;
  setCurrentStudySession: React.Dispatch<React.SetStateAction<StudySession | null>>;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isStopwatchModalOpen: boolean;
  setIsStopwatchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stopwatchTargetDuration: number | undefined;
  setStopwatchTargetDuration: React.Dispatch<React.SetStateAction<number | undefined>>;
  stopwatchModalSubject: string | undefined;
  setStopwatchModalSubject: React.Dispatch<React.SetStateAction<string | undefined>>;
  initialStudyRecord: Partial<StudyRecord> | null;
  setInitialStudyRecord: React.Dispatch<React.SetStateAction<Partial<StudyRecord> | null>>;
  formatMinutesToHoursMinutes: (minutes: number) => string;
  handleCompleteSession: (completedSession: StudySession, durationInMinutes?: number) => void;
  studyHours: string;
  setStudyHours: React.Dispatch<React.SetStateAction<string>>;
  weeklyQuestionsGoal: string;
  setWeeklyQuestionsGoal: React.Dispatch<React.SetStateAction<string>>;
  studyDays: string[];
  setStudyDays: React.Dispatch<React.SetStateAction<string[]>>;
  reminderNotes: ReminderNote[];
  addReminderNote: (text: string) => void;
  toggleReminderNote: (id: string) => void;
  deleteReminderNote: (id: string) => void;
  updateReminderNote: (id: string, newText: string) => void;
  exportAllData: () => any;
  importAllData: (data: any) => Promise<void>;
  deletePlan: (fileName: string) => Promise<void>;
  renameSubject: (subjectId: string, newName: string) => Promise<void>;
  saveSubject: (subjectData: { id?: string; subject: string; topics: EditalTopic[]; color: string }) => Promise<{ success: boolean; error?: string; subjectId?: string; }>;
  refreshPlans: () => Promise<void>;
  topicScores: TopicScore[];
  getRecommendedSession: (options?: { forceSubject?: string | null }) => { recommendedTopic: TopicScore | null; justification: string };
  updateTopicWeight: (subjectId: string, topicText: string, newWeight: number) => Promise<void>;
  availableSubjects: string[];
  availableCategories: string[];
  clearAllData: () => Promise<void>;
  cycleGenerationTimestamp: number | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const calculateTopicScores = (
  studyRecords: StudyRecord[],
  studyPlans: any[],
  selectedDataFile: string,
  availablePlans: string[]
): TopicScore[] => {
  if (!studyPlans || studyPlans.length === 0) return [];

  const currentPlanIndex = availablePlans.indexOf(selectedDataFile);
  if (currentPlanIndex === -1) return [];
  const currentPlanData = studyPlans[currentPlanIndex];

  if (!currentPlanData || !currentPlanData.subjects) return [];

  const getAllTopicsRecursively = (subjects: EditalSubject[]): { subjectId: string, subject: string, topic: string, userWeight: number }[] => {
    const topicList: { subjectId: string, subject: string, topic: string, userWeight: number }[] = [];
    const dive = (subjectId: string, subjectName: string, topics: EditalTopic[]) => {
      for (const topic of topics) {
        const isGroupingTopic = topic.is_grouping_topic || (topic.sub_topics && topic.sub_topics.length > 0);
        
        if (!isGroupingTopic) {
            topicList.push({
              subjectId: subjectId,
              subject: subjectName,
              topic: topic.topic_text,
              userWeight: topic.userWeight || 3,
            });
        }

        if (topic.sub_topics && topic.sub_topics.length > 0) {
          dive(subjectId, subjectName, topic.sub_topics);
        }
      }
    };
    for (const subject of subjects) {
      dive(subject.id, subject.subject, subject.topics);
    }
    return topicList;
  };

  const allTopics = getAllTopicsRecursively(currentPlanData.subjects);

  const topicMetrics: TopicPerformanceMetrics[] = allTopics.map(t => {
    const recordsForTopic = studyRecords.filter(
      r => r.subjectId === t.subjectId && r.topic === t.topic
    );

    let totalQuestions = 0;
    let correctQuestions = 0;
    const studyCount = recordsForTopic.length;
    let daysSinceLastStudy = 999;

    if (recordsForTopic.length > 0) {
      recordsForTopic.forEach(r => {
        if (r.questions) {
          totalQuestions += r.questions.total;
          correctQuestions += r.questions.correct;
        }
      });

      const sortedRecords = recordsForTopic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastStudyDate = new Date(sortedRecords[0].date);
      const today = new Date();
      daysSinceLastStudy = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const hitRate = totalQuestions > 0 ? correctQuestions / totalQuestions : 1.0;

    return {
      subjectId: t.subjectId, // Manter o subjectId
      subject: t.subject, topic: t.topic, hitRate, totalQuestions,
      studyCount, daysSinceLastStudy, userWeight: t.userWeight,
    };
  });

  const maxDays = Math.max(1, ...topicMetrics.map(t => t.daysSinceLastStudy));
  const maxStudyCount = Math.max(1, ...topicMetrics.map(t => t.studyCount));

  return topicMetrics.map(metric => {
    const w1 = 0.5;
    const w2 = 0.2;
    const w3 = 0.3;

    const errorScore = 1 - metric.hitRate;
    const frequencyScore = 1 - (metric.studyCount / maxStudyCount);
    const timeScore = metric.daysSinceLastStudy / maxDays;
    
    const userWeightFactor = (metric.userWeight / 5);

    const score = errorScore * w1 + frequencyScore * w2 + (timeScore * userWeightFactor) * w3;

    const justification = `Prioridade: Taxa de Acertos (${(metric.hitRate * 100).toFixed(0)}%), Frequência (${metric.studyCount}x), Último Estudo (${metric.daysSinceLastStudy}d atrás), Relevância do Usuário (${metric.userWeight}).`;

    return { ...metric, score, justification };
  }).sort((a, b) => b.score - a.score);
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status: authStatus } = useSession();
  const [selectedDataFile, _setSelectedDataFile] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [simuladoRecords, setSimuladoRecords] = useState<SimuladoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>([]);
  const [consistencyOffset, setConsistencyOffset] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Filters>({
    subject: '', category: '', startDate: '', endDate: '',
  });
  const [studyCycle, setStudyCycle] = useState<StudySession[] | null>(null);
  const [sessionProgressMap, setSessionProgressMap] = useState<{[key: string]: number}>({});
  const [completedCycles, setCompletedCycles] = useState(0);
  const [currentProgressMinutes, setCurrentProgressMinutes] = useState(0);
  const [currentStudySession, setCurrentStudySession] = useState<StudySession | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [stopwatchTargetDuration, setStopwatchTargetDuration] = useState<number | undefined>(undefined);
  const [stopwatchModalSubject, setStopwatchModalSubject] = useState<string | undefined>(undefined);
  const [initialStudyRecord, setInitialStudyRecord] = useState<Partial<StudyRecord> | null>(null);
  const [studyHours, setStudyHours] = useState('40');
  const [weeklyQuestionsGoal, setWeeklyQuestionsGoal] = useState('250');
  const [studyDays, setStudyDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [reminderNotes, setReminderNotes] = useState<ReminderNote[]>([]);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [subjects, setSubjects] = useState<EditalSubject[]>([]);
  const [isPlanDataLoaded, setIsPlanDataLoaded] = useState(false);
  const [cycleGenerationTimestamp, setCycleGenerationTimestamp] = useState<number | null>(null);

  const calculateProgressValues = (currentStudyRecords: StudyRecord[], currentStudyCycle: StudySession[] | null) => {
    if (!currentStudyCycle || currentStudyCycle.length === 0) {
      return { numCompletedCycles: 0, progressInCurrentCycle: 0, newSessionProgressMap: {}, totalCycleDuration: 0 };
    }

    let totalProgressMinutes = 0;
    const sortedRecords = [...currentStudyRecords]
      .filter(record => record.countInPlanning)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedRecords.forEach(record => {
      totalProgressMinutes += record.studyTime / 60000;
    });

    const totalCycleDuration = currentStudyCycle.reduce((acc, s) => acc + s.duration, 0);

    if (totalCycleDuration > 0) {
      const numCompletedCycles = Math.floor(totalProgressMinutes / totalCycleDuration);
      const completedCyclesTime = totalCycleDuration * numCompletedCycles;
      
      let progressInCurrentCycle = 0;
      const newSessionProgressMap: { [key: string]: number } = {};
      currentStudyCycle.forEach(session => {
        newSessionProgressMap[session.id as string] = 0;
      });

      let cumulativeTime = 0;

      for (const record of sortedRecords) {
        const recordDuration = record.studyTime / 60000;
        const previousCumulativeTime = cumulativeTime;
        cumulativeTime += recordDuration;

        if (cumulativeTime <= completedCyclesTime) {
          continue;
        }

        let timeToProcessInCurrentCycle = recordDuration;
        if (previousCumulativeTime < completedCyclesTime) {
          timeToProcessInCurrentCycle = cumulativeTime - completedCyclesTime;
        }
        
        progressInCurrentCycle += timeToProcessInCurrentCycle;
        let remainingTimeToDistribute = timeToProcessInCurrentCycle;

        for (const session of currentStudyCycle) {
          if (session.subjectId === record.subjectId) {
            const currentSessionProgress = newSessionProgressMap[session.id as string] || 0;
            if (currentSessionProgress < session.duration) {
              const remainingCapacity = session.duration - currentSessionProgress;
              const amountToDistribute = Math.min(remainingTimeToDistribute, remainingCapacity);
              
              newSessionProgressMap[session.id as string] += amountToDistribute;
              remainingTimeToDistribute -= amountToDistribute;

              if (remainingTimeToDistribute <= 0) {
                break;
              }
            }
          }
        }
      }
      
      return { numCompletedCycles, progressInCurrentCycle, newSessionProgressMap, totalCycleDuration };
    }

    return { numCompletedCycles: 0, progressInCurrentCycle: 0, newSessionProgressMap: {}, totalCycleDuration: 0 };
  };

  const setSelectedDataFile = useCallback((fileName: string) => {
    if (fileName !== selectedDataFile) {
      setIsPlanDataLoaded(false);
      _setSelectedDataFile(fileName);
    }
  }, [selectedDataFile]);
  
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    studyRecords.forEach(record => subjects.add(record.subject));
    studyPlans.forEach(plan => {
      if (plan && plan.subjects) {
        plan.subjects.forEach((s: any) => subjects.add(s.subject));
      }
    });
    return Array.from(subjects).sort();
  }, [studyRecords, studyPlans]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    studyRecords.forEach(record => categories.add(record.category.toLowerCase()));
    
    const defaultCategories = ['Teoria', 'Revisão', 'Leitura de Lei', 'Jurisprudência', 'Questões'];
    defaultCategories.forEach(cat => categories.add(cat.toLowerCase()));

    return Array.from(categories).sort().map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
  }, [studyRecords]);

  const [cycleJustCompleted, setCycleJustCompleted] = useState(false);
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<Stats>({
    totalCorrectQuestions: 0, totalQuestions: 0, dailyStudyTime: {}, dailySubjectStudyTime: {},
    totalStudyTime: 0, uniqueStudyDays: 0, totalPagesRead: 0, pagesPerHour: 0, totalVideoTime: 0,
    totalDaysSinceFirstRecord: 0, failedStudyDays: 0, studyConsistencyPercentage: 0, totalTopics: 0,
    completedTopics: 0, pendingTopics: 0, overallEditalProgress: 0, dailyQuestionStats: {},
    dailyStudyHours: {}, subjectStudyHours: {}, categoryStudyHours: {}, subjectPerformance: {},
    topicPerformance: [], editalData: [], consecutiveDays: 0, consistencyData: [],
    consistencyStartDate: null, consistencyEndDate: null, isConsistencyPrevDisabled: true,
    isConsistencyNextDisabled: true, weeklyHours: 0, weeklyQuestions: 0,
  });

  useEffect(() => {
    if (isPlanDataLoaded && studyPlans.length > 0 && selectedDataFile) {
      const scores = calculateTopicScores(studyRecords, studyPlans, selectedDataFile, availablePlans);
      setTopicScores(scores);
    }
  }, [studyRecords, studyPlans, selectedDataFile, availablePlans, isPlanDataLoaded]);

  const getRecommendedSession = useCallback((options: { forceSubject?: string | null } = {}) => {
    const { forceSubject } = options;

    if (forceSubject) {
        const subjectId = stats.editalData.find(s => s.subject === forceSubject)?.id;
        if (subjectId) {
            const recommendedTopic = topicScores.find(t => t.subjectId === subjectId) || null;
            return {
                recommendedTopic,
                justification: recommendedTopic ? recommendedTopic.justification : `Nenhum tópico encontrado para ${forceSubject}.`
            };
        }
        return { recommendedTopic: null, justification: `Matéria ${forceSubject} não encontrada.` };
    }

    const recommendedTopic = topicScores[0] || null;
    return {
        recommendedTopic,
        justification: recommendedTopic ? recommendedTopic.justification : "Nenhum tópico para recomendar."
    };
  }, [topicScores, stats.editalData]);

  useEffect(() => {
    async function loadPlansAndData() {
      setLoading(true);
      const allPlanFiles = await getJsonFiles();
      const planFiles = allPlanFiles.filter(plan => plan.toUpperCase() !== 'USERS.JSON');
      setAvailablePlans(planFiles);

      const planDataPromises = planFiles.map(file => getJsonContent(file));
      const plansData = await Promise.all(planDataPromises);
      setStudyPlans(plansData);

      const lastSelected = localStorage.getItem('selectedDataFile');
      let initialSelectedFile = '';
      if (lastSelected && planFiles.includes(lastSelected)) {
        initialSelectedFile = lastSelected;
      } else if (planFiles.length > 0) {
        initialSelectedFile = planFiles[0];
      }
      
      if (initialSelectedFile) {
        setSelectedDataFile(initialSelectedFile);
        const serverCycleData = await getStudyCycleFromFile(initialSelectedFile);
        if (serverCycleData) {
          if (serverCycleData.studyCycle && (serverCycleData.studyCycle.groupA || serverCycleData.studyCycle.groupB)) {
            const flatCycle = [...(serverCycleData.studyCycle.groupA || []), ...(serverCycleData.studyCycle.groupB || [])];
            setStudyCycle(flatCycle);
          } else {
            setStudyCycle(serverCycleData.studyCycle);
          }
          setStudyHours(serverCycleData.studyHours);
          setWeeklyQuestionsGoal(serverCycleData.weeklyQuestionsGoal);
          setCurrentProgressMinutes(serverCycleData.currentProgressMinutes);
          setSessionProgressMap(serverCycleData.sessionProgressMap);
          setReminderNotes(serverCycleData.reminderNotes);
          setStudyDays(serverCycleData.studyDays);
          setCompletedCycles(serverCycleData.completedCycles || 0);
          setCycleGenerationTimestamp(serverCycleData.cycleGenerationTimestamp || null);
        }
      }
      setLoading(false);
    }
    
    if (authStatus === 'authenticated') {
      loadPlansAndData();
    } else if (authStatus === 'unauthenticated') {
      setAvailablePlans([]);
      setStudyPlans([]);
      setStudyRecords([]);
      setReviewRecords([]);
      setSimuladoRecords([]);
      _setSelectedDataFile('');
      setLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    async function loadRecordsForSelectedFile() {
      if (selectedDataFile && authStatus === 'authenticated') {
        setLoading(true);
        setIsPlanDataLoaded(false);

        // Executa a migração ANTES de carregar os dados
        const migrationResult = await migrateToSubjectIds(selectedDataFile);
        if (migrationResult.error) {
          showNotification(`Erro na migração de dados: ${migrationResult.error}`, 'error');
        }
        if (migrationResult.migrated) {
          showNotification('Dados atualizados para a nova versão com sucesso!', 'success');
          // Recarrega os dados do plano migrado para atualizar o estado
          const newPlanContent = await getJsonContent(selectedDataFile);
          if (newPlanContent) {
            setStudyPlans(prevPlans => {
              const planIndex = availablePlans.indexOf(selectedDataFile);
              if (planIndex !== -1) {
                const updatedPlans = [...prevPlans];
                updatedPlans[planIndex] = newPlanContent;
                return updatedPlans;
              }
              return prevPlans;
            });
          }
        }

        const records = await getStudyRecords(selectedDataFile);
        setStudyRecords(records);
        const reviews = await getReviewRecords(selectedDataFile);
        setReviewRecords(reviews);
        const simulados = await getSimuladoRecords(selectedDataFile);
        setSimuladoRecords(simulados);
        
        const serverCycleData = await getStudyCycleFromFile(selectedDataFile);
        if (serverCycleData) {
          if (serverCycleData.studyCycle && (serverCycleData.studyCycle.groupA || serverCycleData.studyCycle.groupB)) {
            const flatCycle = [...(serverCycleData.studyCycle.groupA || []), ...(serverCycleData.studyCycle.groupB || [])];
            setStudyCycle(flatCycle);
          } else {
            setStudyCycle(serverCycleData.studyCycle);
          }
          setStudyHours(serverCycleData.studyHours);
          setWeeklyQuestionsGoal(serverCycleData.weeklyQuestionsGoal);
          setCurrentProgressMinutes(serverCycleData.currentProgressMinutes);
          setSessionProgressMap(serverCycleData.sessionProgressMap);
          setReminderNotes(serverCycleData.reminderNotes);
          setStudyDays(serverCycleData.studyDays);
          setCompletedCycles(serverCycleData.completedCycles || 0);
          setCycleGenerationTimestamp(serverCycleData.cycleGenerationTimestamp || null);
        } else {
          setStudyCycle(null);
          setStudyHours('40');
          setWeeklyQuestionsGoal('250');
          setCurrentProgressMinutes(0);
          setSessionProgressMap({});
          setReminderNotes([]);
          setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
          setCompletedCycles(0);
          setCycleGenerationTimestamp(null);
        }
        setLoading(false);
        setIsPlanDataLoaded(true);
      }
    }
    loadRecordsForSelectedFile();
  }, [selectedDataFile, authStatus, showNotification]);

  useEffect(() => {
    if (!loading && isPlanDataLoaded && selectedDataFile) {
      const cycleData = {
        studyCycle, studyHours, weeklyQuestionsGoal, currentProgressMinutes,
        sessionProgressMap, reminderNotes, studyDays, completedCycles, cycleGenerationTimestamp
      };
      saveStudyCycleToFile(selectedDataFile, cycleData);
    }
  }, [studyCycle, studyHours, weeklyQuestionsGoal, currentProgressMinutes, sessionProgressMap, reminderNotes, studyDays, completedCycles, cycleGenerationTimestamp, loading, isPlanDataLoaded, selectedDataFile]);

  useEffect(() => {
    async function updateStats() {
      if (studyPlans.length > 0 && availablePlans.length > 0 && selectedDataFile) {
        const newStats = await calculateStats(studyRecords, selectedDataFile, activeFilters, studyPlans, availablePlans, consistencyOffset, studyDays, studyCycle);
        setStats(newStats);
      }
    }
    updateStats();
  }, [studyRecords, selectedDataFile, activeFilters, studyPlans, availablePlans, consistencyOffset, studyDays, studyCycle]);



  const [isAnimatingCompletion, setIsAnimatingCompletion] = useState(false);

  // Controller useEffect
  useEffect(() => {
    if (!studyCycle || !studyRecords || isAnimatingCompletion) return;

    const recordsToConsider = cycleGenerationTimestamp
      ? studyRecords.filter(r => {
          // Tenta obter o timestamp preciso do ID do registro
          const idParts = r.id.split('-');
          const recordTimestamp = parseInt(idParts[0], 10);

          // Se o ID contiver um timestamp válido, use-o para uma filtragem precisa
          if (!isNaN(recordTimestamp)) {
            return recordTimestamp >= cycleGenerationTimestamp;
          }

          // Fallback para registros mais antigos ou com formato de ID diferente
          const [year, month, day] = r.date.split('-').map(Number);
          const recordDate = new Date(Date.UTC(year, month - 1, day));
          
          const cycleDate = new Date(cycleGenerationTimestamp);
          cycleDate.setUTCHours(0, 0, 0, 0);

          return recordDate.getTime() >= cycleDate.getTime();
        })
      : studyRecords;

    const { numCompletedCycles, progressInCurrentCycle, newSessionProgressMap } = calculateProgressValues(recordsToConsider, studyCycle);

    if (numCompletedCycles > completedCycles) {
      setIsAnimatingCompletion(true);
    } else {
      // Normal update
      if (numCompletedCycles < completedCycles) {
        setCompletedCycles(numCompletedCycles);
      }
      setCurrentProgressMinutes(progressInCurrentCycle);
      setSessionProgressMap(newSessionProgressMap);
    }
  }, [studyRecords, studyCycle, completedCycles, isAnimatingCompletion, cycleGenerationTimestamp]);

  // Animation useEffect
  useEffect(() => {
    if (isAnimatingCompletion) {
      const { numCompletedCycles, progressInCurrentCycle, newSessionProgressMap, totalCycleDuration } = calculateProgressValues(studyRecords, studyCycle);
      
      // 1. Set to 100% and show notification
      setCurrentProgressMinutes(totalCycleDuration);
      const fullSessionMap: { [key: string]: number } = {};
      if (studyCycle) {
        studyCycle.forEach(session => {
          fullSessionMap[session.id as string] = session.duration;
        });
      }
      setSessionProgressMap(fullSessionMap);
      showNotification('Parabéns! Você concluiu um ciclo de estudos completo!', 'success');

      // 2. Set timer to end animation and trigger final update
      const timer = setTimeout(() => {
        setCompletedCycles(numCompletedCycles);
        setCurrentProgressMinutes(progressInCurrentCycle);
        setSessionProgressMap(newSessionProgressMap);
        setIsAnimatingCompletion(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAnimatingCompletion, studyRecords, studyCycle, showNotification]);

  const addStudyRecord = useCallback(async (record: Omit<StudyRecord, 'id' | 'subjectId'> & { subject: string }) => {
    if (!selectedDataFile) {
      showNotification('Nenhum plano de estudos selecionado.', 'error');
      return;
    }

    const subjectData = stats.editalData.find(s => s.subject === record.subject);
    if (!subjectData) {
      showNotification(`Matéria "${record.subject}" não encontrada no plano de estudos.`, 'error');
      return;
    }
    
    const newRecord = { 
      ...record, 
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subjectId: subjectData.id
    };
    
    try {
      setStudyRecords(prevRecords => [...prevRecords, newRecord]);
      await saveStudyRecord(selectedDataFile, newRecord);
      showNotification('Registro de estudo salvo com sucesso!', 'success');

      if (newRecord.reviewPeriods && newRecord.reviewPeriods.length > 0) {
        const newReviewRecords: ReviewRecord[] = [];
        newRecord.reviewPeriods.forEach(period => {
          const [year, month, day] = newRecord.date.split('-').map(Number);
          const originalDate = new Date(Date.UTC(year, month - 1, day));
          let scheduledDate = new Date(originalDate);

          if (period.endsWith('d')) {
            scheduledDate.setUTCDate(originalDate.getUTCDate() + parseInt(period.slice(0, -1)));
          } else if (period.endsWith('w')) {
            scheduledDate.setUTCDate(originalDate.getUTCDate() + (parseInt(period.slice(0, -1)) * 7));
          } else if (period.endsWith('m')) {
            scheduledDate.setUTCMonth(originalDate.getUTCMonth() + parseInt(period.slice(0, -1)));
          }

          newReviewRecords.push({
            id: `${newRecord.id}-${period}`, studyRecordId: newRecord.id,
            scheduledDate: scheduledDate.toISOString().split('T')[0], status: 'pending',
            originalDate: newRecord.date, subjectId: newRecord.subjectId, subject: newRecord.subject, topic: newRecord.topic,
            reviewPeriod: period,
          });
        });

        setReviewRecords(prevReviews => [...prevReviews, ...newReviewRecords]);
        for (const review of newReviewRecords) {
          await saveReviewRecord(selectedDataFile, review);
        }
      }
    } catch (error) {
      console.error("Falha ao salvar o registro de estudo:", error);
      showNotification('Erro ao salvar o registro. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification, stats.editalData]);

  const addSimuladoRecord = useCallback(async (record: Omit<SimuladoRecord, 'id'>) => {
    if (!selectedDataFile) {
      showNotification('Nenhum plano de estudos selecionado para salvar o simulado.', 'error');
      return;
    }
    const newRecord = { ...record, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    try {
      setSimuladoRecords(prevRecords => [...prevRecords, newRecord]);
      await saveSimuladoRecord(selectedDataFile, newRecord);
      showNotification('Simulado salvo com sucesso!', 'success');
    } catch (error) {
      console.error("Falha ao salvar o simulado:", error);
      showNotification('Erro ao salvar o simulado. Tente novamente.', 'error');
      setSimuladoRecords(prevRecords => prevRecords.filter(r => r.id !== newRecord.id));
    }
  }, [selectedDataFile, showNotification]);

  const updateSimuladoRecord = useCallback(async (record: SimuladoRecord) => {
    if (!selectedDataFile) return;
    try {
      await updateSimuladoRecordAction(selectedDataFile, record);
      setSimuladoRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));
      showNotification('Simulado atualizado com sucesso!', 'success');
    } catch (error) {
      console.error("Falha ao atualizar o simulado:", error);
      showNotification('Erro ao atualizar o simulado. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification]);

  const deleteSimuladoRecord = useCallback(async (id: string) => {
    if (!selectedDataFile) return;
    try {
      await deleteSimuladoRecordActionImport(selectedDataFile, id);
      setSimuladoRecords(prevRecords => prevRecords.filter(r => r.id !== id));
      showNotification('Simulado excluído com sucesso!', 'info');
    } catch (error) {
      console.error("Falha ao excluir o simulado:", error);
      showNotification('Erro ao excluir o simulado. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification]);

  const updateStudyRecord = useCallback(async (record: StudyRecord) => {
    if (!selectedDataFile) return;
    await saveStudyRecord(selectedDataFile, record);
    setStudyRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));

    setReviewRecords(prevReviews => prevReviews.filter(r => r.studyRecordId !== record.id));

    if (record.reviewPeriods && record.reviewPeriods.length > 0) {
      const newReviewRecords: ReviewRecord[] = [];
      record.reviewPeriods.forEach(period => {
        const [year, month, day] = record.date.split('-').map(Number);
        const originalDate = new Date(Date.UTC(year, month - 1, day)); 
        let scheduledDate = new Date(originalDate);

        if (period.endsWith('d')) {
          scheduledDate.setUTCDate(originalDate.getUTCDate() + parseInt(period.slice(0, -1)));
        } else if (period.endsWith('w')) {
          scheduledDate.setUTCDate(originalDate.getUTCDate() + (parseInt(period.slice(0, -1)) * 7));
        } else if (period.endsWith('m')) {
          scheduledDate.setUTCMonth(originalDate.getUTCMonth() + parseInt(period.slice(0, -1)));
        }

        newReviewRecords.push({
          id: `${record.id}-${period}`, studyRecordId: record.id,
          scheduledDate: scheduledDate.toISOString().split('T')[0], status: 'pending',
          originalDate: record.date, subjectId: record.subjectId, subject: record.subject, topic: record.topic,
          reviewPeriod: period, completedDate: undefined, ignored: false,
        });
      });

      for (const review of newReviewRecords) {
        await saveReviewRecord(selectedDataFile, review);
      }
      setReviewRecords(prevReviews => [...prevReviews, ...newReviewRecords]);
    }
  }, [selectedDataFile]);

  const deleteStudyRecord = useCallback(async (id: string) => {
    if (!selectedDataFile) return;
    try {
      await deleteStudyRecordAction(selectedDataFile, id);
      setStudyRecords(prevRecords => prevRecords.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete study record:", error);
    }
  }, [selectedDataFile]);

  const updateReviewRecord = useCallback(async (record: ReviewRecord) => {
    if (!selectedDataFile) return;
    await saveReviewRecord(selectedDataFile, record);
    setReviewRecords(prevRecords => prevRecords.map(r => (r.id === record.id ? record : r)));
  }, [selectedDataFile]);

  const applyFilters = useCallback((filters: Filters) => {
    setActiveFilters(filters);
  }, []);

  const generateStudyCycleLogic = (settings: {
    studyHours: number;
    minSession: number;
    maxSession: number;
    subjectSettings: { [subjectId: string]: { importance: number; knowledge: number } };
    subjects: EditalSubject[];
  }): StudySession[] => {
    const { studyHours, minSession, maxSession, subjects: allSelectedSubjects } = settings;
    const totalMinutes = studyHours * 60;

    if (topicScores.length === 0) {
      showNotification('Não há dados de tópicos para gerar o ciclo. Verifique os pesos e o histórico.', 'warning');
      return [];
    }

    const selectedSubjectIds = new Set(allSelectedSubjects.map(s => s.id));

    const relevantTopicScores = topicScores.filter(t => selectedSubjectIds.has(t.subjectId));

    if (relevantTopicScores.length === 0) {
        showNotification('Nenhum tópico relevante encontrado para as matérias selecionadas. Tente calcular os pesos por banca.', 'warning');
        return [];
    }

    // Ordena a lista de tópicos UMA VEZ, do maior score para o menor.
    relevantTopicScores.sort((a, b) => b.score - a.score);

    // Agrupa os tópicos por matéria para garantir a rotação
    const topicsBySubject = new Map<string, TopicScore[]>();
    for (const topic of relevantTopicScores) {
        if (!topicsBySubject.has(topic.subjectId)) {
            topicsBySubject.set(topic.subjectId, []);
        }
        topicsBySubject.get(topic.subjectId)!.push(topic);
    }

    // Cria uma fila de matérias para fazer o round-robin
    const subjectQueue = Array.from(topicsBySubject.keys());
    
    const cycle: StudySession[] = [];
    let remainingMinutes = totalMinutes;
    const subjectDataMap = new Map(allSelectedSubjects.map(s => [s.id, { color: s.color, name: s.subject }]));
    let queueIndex = 0;

    while (remainingMinutes >= minSession && subjectQueue.length > 0) {
        const currentSubjectId = subjectQueue[queueIndex];
        const subjectTopics = topicsBySubject.get(currentSubjectId);

        // Se a matéria não tem mais tópicos, remove da fila e continua
        if (!subjectTopics || subjectTopics.length === 0) {
            subjectQueue.splice(queueIndex, 1);
            if (queueIndex >= subjectQueue.length) {
                queueIndex = 0; // Volta ao início se removeu o último
            }
            continue;
        }

        // Pega o tópico de maior pontuação para a matéria atual
        const bestTopic = subjectTopics.shift()!; // Remove o primeiro elemento
        const subjectData = subjectDataMap.get(currentSubjectId);

        if (!subjectData) {
            // Caso raro: a matéria não tem dados. Pula para a próxima.
            queueIndex = (queueIndex + 1) % subjectQueue.length;
            continue;
        }

        // Calcula a duração da sessão
        const { importance, knowledge } = settings.subjectSettings[currentSubjectId] || { importance: 3, knowledge: 3 };
        const effectiveWeight = importance / (knowledge || 1);
        const normalizedWeight = (effectiveWeight - 1/5) / (5 - 1/5);
        let sessionDuration = minSession + (maxSession - minSession) * normalizedWeight;
        sessionDuration = Math.round(sessionDuration / 5) * 5;
        sessionDuration = Math.max(minSession, Math.min(maxSession, sessionDuration));

        const finalDuration = Math.min(sessionDuration, remainingMinutes);
        
        if (finalDuration < minSession) {
            // Não há mais tempo suficiente para uma sessão mínima, encerra.
            break;
        }

        cycle.push({ 
            id: `${Date.now()}-session-${cycle.length}`,
            subjectId: currentSubjectId,
            subject: subjectData.name,
            duration: finalDuration,
            color: subjectData.color
        });

        remainingMinutes -= finalDuration;

        // Avança para a próxima matéria na fila
        queueIndex = (queueIndex + 1) % subjectQueue.length;
    }

    return cycle;
  };

  const generateStudyCycle = useCallback((settings: {
    studyHours: number;
    minSession: number;
    maxSession: number;
    subjectSettings: any;
    subjects: any[];
    weeklyQuestionsGoal: string;
  }) => {
    const finalCycle = generateStudyCycleLogic(settings);
    setStudyCycle(finalCycle);
    // Reset explícito para garantir que o novo ciclo comece do zero.
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setCycleGenerationTimestamp(Date.now());
    setStudyHours(String(settings.studyHours));
    setWeeklyQuestionsGoal(settings.weeklyQuestionsGoal);
  }, [topicScores, showNotification]);

  const resetStudyCycle = useCallback(async () => {
    if (selectedDataFile) {
      await deleteStudyCycleFile(selectedDataFile);
    }
    setStudyCycle(null);
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setCycleGenerationTimestamp(null); // Adicionado para limpar o timestamp
    setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
    showNotification('Planejamento removido. Você pode criar um novo ciclo.', 'success');
  }, [selectedDataFile, showNotification]);

  const handleConsistencyNav = useCallback((direction: number) => {
    setConsistencyOffset(prev => prev + direction);
  }, []);

  const formatMinutesToHoursMinutes = useCallback((totalMinutes: number) => {
    if (totalMinutes < 0) return '0min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h${String(minutes).padStart(2, '0')}min`;
    } else {
      return `${minutes}min`;
    }
  }, []);

  const handleCompleteSession = useCallback((completedSession: StudySession, durationInMinutes?: number) => {
    if (!studyCycle) return;
    const sessionDuration = durationInMinutes ?? completedSession.duration;

    setSessionProgressMap(prevMap => ({
      ...prevMap,
      [completedSession.id as string]: (prevMap[completedSession.id as string] || 0) + sessionDuration,
    }));
    
    setCurrentProgressMinutes(prevMinutes => prevMinutes + sessionDuration);
  }, [studyCycle]);

  const addReminderNote = useCallback((text: string) => {
    const newNote: ReminderNote = {
      id: Date.now().toString(), text, completed: false,
    };
    setReminderNotes(prevNotes => [...prevNotes, newNote]);
    showNotification('Lembrete adicionado!', 'success');
  }, [showNotification]);

  const toggleReminderNote = useCallback((id: string) => {
    setReminderNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  }, []);

  const deleteReminderNote = useCallback((id: string) => {
    setReminderNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    showNotification('Lembrete removido.', 'info');
  }, [showNotification]);

  const updateReminderNote = useCallback((id: string, newText: string) => {
    setReminderNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, text: newText } : note
      )
    );
    showNotification('Lembrete atualizado!', 'success');
  }, [showNotification]);

  const updateTopicWeight = useCallback(async (subjectId: string, topicText: string, newWeight: number) => {
    if (!selectedDataFile) return;

    // Otimistic UI update
    setStudyPlans(prevPlans => {
      const planIndex = availablePlans.indexOf(selectedDataFile);
      if (planIndex === -1) return prevPlans;

      const newPlans = [...prevPlans];
      const planToUpdate = JSON.parse(JSON.stringify(newPlans[planIndex]));

      const subjectIndex = planToUpdate.subjects.findIndex((s:any) => s.id === subjectId);
      if (subjectIndex === -1) return prevPlans;
      
      const findAndApplyWeight = (topics: EditalTopic[]) => {
        for (let i = 0; i < topics.length; i++) {
          if (topics[i].topic_text === topicText) {
            topics[i].userWeight = newWeight;
            return true;
          }
          if (topics[i].sub_topics) {
            if (findAndApplyWeight(topics[i].sub_topics!)) return true;
          }
        }
        return false;
      };

      findAndApplyWeight(planToUpdate.subjects[subjectIndex].topics);
      newPlans[planIndex] = planToUpdate;
      return newPlans;
    });

    const result = await updateTopicWeightAction(selectedDataFile, subjectId, topicText, newWeight);
    if (!result.success) {
      showNotification('Erro ao salvar o peso do tópico.', 'error');
      // Reverter a alteração otimista seria ideal aqui, mas por simplicidade vamos recarregar.
      refreshPlans(); 
    }
  }, [selectedDataFile, showNotification, availablePlans]);

  const deletePlan = useCallback(async (fileName: string) => {
    try {
      await deleteJsonFile(fileName);
      await deleteStudyCycleFile(fileName);

      const updatedPlans = availablePlans.filter(p => p !== fileName);
      setAvailablePlans(updatedPlans);

      if (selectedDataFile === fileName) {
        const newSelectedFile = updatedPlans[0] || '';
        setSelectedDataFile(newSelectedFile);
        localStorage.setItem('selectedDataFile', newSelectedFile);
        setStudyCycle(null);
      }

      showNotification(`Plano "${fileName}" e seu ciclo associado foram excluídos.`, 'success');
    } catch (error) {
      console.error("Falha ao excluir o plano:", error);
      showNotification('Erro ao excluir o plano. Tente novamente.', 'error');
    }
  }, [availablePlans, selectedDataFile, showNotification]);

  const renameSubject = useCallback(async (subjectId: string, newName: string) => {
    if (!selectedDataFile) {
      showNotification('Nenhum plano de estudos selecionado.', 'error');
      return;
    }

    const subject = stats.editalData.find(s => s.id === subjectId);
    if (!subject) {
        showNotification('Matéria não encontrada.', 'error');
        return;
    }
    const oldName = subject.subject;

    if (oldName === newName) {
      showNotification('O novo nome da matéria é o mesmo que o antigo.', 'info');
      return;
    }

    try {
      const result = await renameSubjectAction(selectedDataFile, subjectId, newName);
      if (result.success) {
        showNotification(`Matéria '${oldName}' renomeada para '${newName}' com sucesso!`, 'success');
        
        // Atualização otimista do estado para evitar o reload da página
        const planIndex = availablePlans.indexOf(selectedDataFile);
        if (planIndex !== -1) {
          // 1. Atualiza studyPlans
          const updatedStudyPlans = [...studyPlans];
          const planToUpdate = { ...updatedStudyPlans[planIndex] };
          planToUpdate.subjects = planToUpdate.subjects.map((s: any) => 
            s.id === subjectId ? { ...s, subject: newName } : s
          );
          updatedStudyPlans[planIndex] = planToUpdate;
          setStudyPlans(updatedStudyPlans);

          // 2. Atualiza studyRecords
          setStudyRecords(prevRecords => prevRecords.map(r =>
            r.subjectId === subjectId ? { ...r, subject: newName } : r
          ));

          // 3. Atualiza reviewRecords
          setReviewRecords(prevReviews => prevReviews.map(rr =>
            rr.subjectId === subjectId ? { ...rr, subject: newName } : rr
          ));

          // 4. Atualiza simuladoRecords
          setSimuladoRecords(prevSimulados => prevSimulados.map(sr => ({
            ...sr,
            subjects: sr.subjects.map(ss =>
              ss.id === subjectId ? { ...ss, subjectName: newName } : ss
            ),
          })));
        }

        // 5. Atualiza studyCycle
        if (studyCycle) {
          setStudyCycle(prevCycle =>
            prevCycle!.map(session =>
              session.subjectId === subjectId ? { ...session, subject: newName } : session
            )
          );
        }
      } else {
        showNotification(result.error || 'Falha ao renomear a matéria.', 'error');
      }
    } catch (error) {
      console.error("Erro ao renomear matéria:", error);
      showNotification('Erro ao renomear matéria. Tente novamente.', 'error');
    }
  }, [selectedDataFile, showNotification, stats.editalData]);



  const exportAllData = useCallback(async () => {
    const serverData = await exportFullBackupAction();
    const clientData = {
      version: 3,
      selectedDataFile, studyCycle, sessionProgressMap, completedCycles,
      currentProgressMinutes, studyHours, weeklyQuestionsGoal, studyDays, reminderNotes,
    };
    return { ...serverData, clientData };
  }, [
    selectedDataFile, studyCycle, sessionProgressMap, completedCycles,
    currentProgressMinutes, studyHours, weeklyQuestionsGoal, studyDays, reminderNotes,
  ]);

  const importAllData = useCallback(async (data: any) => {
    if (!data.clientData || !data.plans) {
      throw new Error('Arquivo de backup inválido ou incompatível.');
    }

    // A ação do servidor agora lida com a restauração de todos os arquivos, incluindo os ciclos
    const result = await restoreFullBackupAction(data);

    if (result.success) {
      // Após a restauração bem-sucedida, atualizamos o estado do cliente a partir do backup
      const { clientData } = data;
      localStorage.setItem('selectedDataFile', clientData.selectedDataFile || '');
      // As outras restaurações de estado (setStudyCycle, etc.) são tratadas pelo reload
      // que acionará os useEffects para carregar os dados dos arquivos restaurados.
      
      showNotification('Backup restaurado com sucesso! A página será recarregada.', 'success');

      // Recarregar a página para que todos os componentes releiam os novos dados do zero
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Pequeno delay para garantir que a notificação seja visível

    } else {
      throw new Error(result.error || 'Falha ao restaurar o backup no servidor.');
    }
  }, [showNotification]);

  const refreshPlans = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    setLoading(true);
    const allPlanFiles = await getJsonFiles();
    const planFiles = allPlanFiles.filter(plan => plan.toUpperCase() !== 'USERS.JSON');
    setAvailablePlans(planFiles);

    const planDataPromises = planFiles.map(file => getJsonContent(file));
    const plansData = await Promise.all(planDataPromises);
    setStudyPlans(plansData);
    setLoading(false);
  }, [authStatus]);

  const saveSubject = useCallback(async (subjectData: { id?: string; subject: string; topics: EditalTopic[]; color: string }) => {
    if (!selectedDataFile) {
      const errorMsg = 'Nenhum plano de estudos selecionado.';
      showNotification(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    try {
      const result = await addOrUpdateSubjectAction(selectedDataFile, subjectData);
      if (result.success) {
        showNotification(`Matéria "${subjectData.subject}" salva com sucesso!`, 'success');
        await refreshPlans();
        return { success: true, subjectId: result.subjectId };
      } else {
        showNotification(result.error || 'Falha ao salvar a matéria.', 'error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = 'Erro ao comunicar com o servidor para salvar a matéria.';
      console.error(errorMsg, error);
      showNotification(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }, [selectedDataFile, showNotification, refreshPlans]);

  const clearAllData = useCallback(async () => {
    try {
      await clearAllDataAction();
      // Limpa o estado local para refletir a remoção dos dados
      _setSelectedDataFile('');
      setAvailablePlans([]);
      setStudyPlans([]);
      setStudyRecords([]);
      setSimuladoRecords([]);
      setReviewRecords([]);
      setStudyCycle(null);
      setSessionProgressMap({});
      setCompletedCycles(0);
      setCurrentProgressMinutes(0);
      setReminderNotes([]);
      localStorage.removeItem('selectedDataFile');
      
      showNotification('Todos os dados foram apagados com sucesso! A página será recarregada.', 'success');

      // Recarrega a página para um estado limpo
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Falha ao limpar todos os dados:", error);
      showNotification('Erro ao apagar os dados. Tente novamente.', 'error');
    }
  }, [showNotification]);

  return (
    <DataContext.Provider value={{
      selectedDataFile, setSelectedDataFile, availablePlans, studyPlans,
      studyRecords, reviewRecords, simuladoRecords, stats, addStudyRecord,
      addSimuladoRecord, updateStudyRecord, deleteStudyRecord, updateReviewRecord,
      updateSimuladoRecord, deleteSimuladoRecord, applyFilters, studyCycle,
      setStudyCycle, generateStudyCycle, resetStudyCycle, handleConsistencyNav,
      loading, sessionProgressMap, setSessionProgressMap, completedCycles,
      setCompletedCycles, currentProgressMinutes, setCurrentProgressMinutes,
      currentStudySession, setCurrentStudySession, isRegisterModalOpen,
      setIsRegisterModalOpen, isStopwatchModalOpen, setIsStopwatchModalOpen,
      stopwatchTargetDuration, setStopwatchTargetDuration, stopwatchModalSubject,
      setStopwatchModalSubject, initialStudyRecord, setInitialStudyRecord,
      formatMinutesToHoursMinutes, handleCompleteSession, studyHours, setStudyHours,
      weeklyQuestionsGoal, setWeeklyQuestionsGoal, studyDays, setStudyDays,
      reminderNotes, addReminderNote, toggleReminderNote, deleteReminderNote,
      updateReminderNote, exportAllData, importAllData, deletePlan, renameSubject, saveSubject,
      topicScores, getRecommendedSession, updateTopicWeight, availableSubjects, availableCategories, clearAllData, refreshPlans,
      cycleGenerationTimestamp,
    }}>      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
