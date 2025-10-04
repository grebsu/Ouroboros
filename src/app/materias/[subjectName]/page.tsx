'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FaPlusCircle, FaCaretDown, FaCaretRight } from 'react-icons/fa';
import { getJsonContent, getStudyRecords, StudyRecord } from '../../actions';
import { useData } from '../../../context/DataContext';
import { useTheme } from '../../../context/ThemeContext';
import StudyRegisterModal from '../../../components/StudyRegisterModal';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// Interfaces
interface PlanData {
  name: string;
  observations: string;
  cargo?: string;
  edital?: string;
  iconUrl?: string;
  subjects: Subject[];
  bancaTopicWeights?: {
    [subjectName: string]: {
      [topicText: string]: number; // Weight from 1 to 5
    };
  };
}

interface Subject {
  subject: string;
  topics: Topic[];
  color: string;
}

interface Topic {
  topic_number?: string;
  topic_text: string;
  sub_topics?: Topic[];
}

// Função auxiliar para formatar o tempo
const formatTime = (milliseconds: number) => {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return '0h 0m';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const countTopicsRecursively = (topics: Topic[]): number => {
  let count = 0;
  for (const topic of topics) {
    count++; // Count the current topic
    if (topic.sub_topics && topic.sub_topics.length > 0) {
      count += countTopicsRecursively(topic.sub_topics); // Add count of subtopics
    }
  }
  return count;
};

const countStudiedTopicsRecursively = (topics: Topic[], studiedTopicTexts: Set<string>): number => {
  let count = 0;
  for (const topic of topics) {
    if (studiedTopicTexts.has(topic.topic_text)) {
      count++;
    }
    if (topic.sub_topics && topic.sub_topics.length > 0) {
      count += countStudiedTopicsRecursively(topic.sub_topics, studiedTopicTexts);
    }
  }
  return count;
};

// Função para normalizar os dados do plano
const normalizePlanData = (data: PlanData | Subject[] | null, fileName: string): PlanData => {
  const defaultColor = '#94A3B8';

  if (Array.isArray(data)) {
    const subjectsWithColors = data.map(subject => ({
      ...subject,
      color: subject.color || defaultColor,
    }));
    return {
      name: fileName.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      observations: '',
      cargo: '',
      edital: '',
      iconUrl: undefined,
      subjects: subjectsWithColors,
    };
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];
    const subjectsWithColors = subjects.map((subject: Subject) => ({
      ...subject,
      color: subject.color || defaultColor,
    }));
    return {
      ...data,
      name: data.name || fileName.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      observations: data.observations || '',
      cargo: (data as any).cargo || '',
      edital: (data as any).edital || '',
      subjects: subjectsWithColors,
    };
  }

  return {
    name: fileName.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    observations: '',
    cargo: '',
    edital: '',
    iconUrl: undefined,
    subjects: [],
  };
};

const flattenTopicsWithLevel = (topics: Topic[], level = 0): (Topic & { level: number })[] => {
  let flattened: (Topic & { level: number })[] = [];
  for (const topic of topics) {
    flattened.push({ ...topic, level });
    if (topic.sub_topics && topic.sub_topics.length > 0) {
      flattened = flattened.concat(flattenTopicsWithLevel(topic.sub_topics, level + 1));
    }
  }
  return flattened;
};

export default function MateriaDetalhes() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subjectName = decodeURIComponent(params.subjectName as string);
  const initialFileName = searchParams.get('plan');
  const banca = searchParams.get('banca');

  const { 
    studyRecords, 
    addStudyRecord, 
    updateStudyRecord, 
    deleteStudyRecord, 
    availablePlans, 
    selectedDataFile, 
    setSelectedDataFile 
  } = useData();
  const { theme } = useTheme();

  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ subject: string; topic: Topic } | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [allTopicsExpanded, setAllTopicsExpanded] = useState(true); // Novo estado para controlar a expansão/colapso de todos os tópicos
  
  // Novos estados para os tópicos processados
  const [flattenedTopics, setFlattenedTopics] = useState<(Topic & { level: number })[]>([]);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);

  useEffect(() => {
    const fetchPlanAndRecords = async () => {
      setLoading(true);
      const currentFile = selectedDataFile || initialFileName;
      if (currentFile) {
        const data = await getJsonContent(currentFile);
        if (data) {
          const normalizedData = normalizePlanData(data, currentFile);
          setPlanData(normalizedData);

          // Processa os tópicos após carregar os dados
          const subject = normalizedData.subjects.find(s => s.subject === subjectName);
          if (subject) {
            setFlattenedTopics(flattenTopicsWithLevel(subject.topics || []));
            setTotalTopicsCount(countTopicsRecursively(subject.topics || []));
          }
        }
      }
      setLoading(false);
    };
    fetchPlanAndRecords();
  }, [selectedDataFile, initialFileName, subjectName]);

  const filteredStudyRecords = useMemo(() => {
    return studyRecords.filter(record => record.subject === subjectName);
  }, [studyRecords, subjectName]);

  const currentSubject = useMemo(() => {
    return planData?.subjects.find(s => s.subject === subjectName);
  }, [planData, subjectName]);

  const totalStudyTime = useMemo(() => {
    return filteredStudyRecords.reduce((acc, record) => acc + (record.studyTime || 0), 0);
  }, [filteredStudyRecords]);

  const totalCorrectQuestions = useMemo(() => {
    return filteredStudyRecords.reduce((acc, record) => acc + (record.questions?.correct || 0), 0);
  }, [filteredStudyRecords]);

  const totalIncorrectQuestions = useMemo(() => {
    return filteredStudyRecords.reduce((acc, record) => acc + ((record.questions?.total || 0) - (record.questions?.correct || 0)), 0);
  }, [filteredStudyRecords]);

  const totalQuestions = totalCorrectQuestions + totalIncorrectQuestions;
  const performancePercentage = totalQuestions > 0 ? Math.round((totalCorrectQuestions / totalQuestions) * 100) : 0;

  const studiedTopics = useMemo(() => {
    const studiedTopicTexts = new Set(filteredStudyRecords.map(record => record.topic));
    return countStudiedTopicsRecursively(currentSubject?.topics || [], studiedTopicTexts);
  }, [filteredStudyRecords, currentSubject]);

  const pendingTopics = totalTopicsCount - studiedTopics;
  const progressPercentage = totalTopicsCount > 0 ? Math.round((studiedTopics / totalTopicsCount) * 100) : 0;

  const totalPagesRead = useMemo(() => {
    return filteredStudyRecords.reduce((acc, record) => {
        if (record.pagesRead) {
            return acc + record.pagesRead;
        }
        if (record.pages) {
            return acc + record.pages.reduce((pageAcc, page) => pageAcc + (page.end - page.start + 1), 0);
        }
        return acc;
    }, 0);
  }, [filteredStudyRecords]);

  const pagesReadPerHour = totalStudyTime > 0 ? (totalPagesRead / (totalStudyTime / 3600000)).toFixed(1) : 0;

  const aggregateDailyData = useCallback(() => {
    const dailyData: { [key: string]: number } = {};
    filteredStudyRecords.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + (record.studyTime || 0);
    });
    return Object.keys(dailyData).sort().map(date => ({ date, time: dailyData[date] }));
  }, [filteredStudyRecords]);

  const aggregateWeeklyData = useCallback(() => {
    const weeklyData: { [key: string]: number } = {};
    filteredStudyRecords.forEach(record => {
      const date = new Date(record.date);
      const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      weeklyData[startOfWeek] = (weeklyData[startOfWeek] || 0) + (record.studyTime || 0);
    });
    return Object.keys(weeklyData).sort().map(date => ({ date, time: weeklyData[date] }));
  }, [filteredStudyRecords]);

  const aggregateMonthlyData = useCallback(() => {
    const monthlyData: { [key: string]: number } = {};
    filteredStudyRecords.forEach(record => {
      const date = new Date(record.date);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyData[month] = (monthlyData[month] || 0) + (record.studyTime || 0);
    });
    return Object.keys(monthlyData).sort().map(date => ({ date, time: monthlyData[date] }));
  }, [filteredStudyRecords]);

  const chartData = useMemo(() => {
    let data;
    let label;
    let unit;

    if (activeTab === 'daily') {
      data = aggregateDailyData();
      label = 'Tempo de Estudo Diário';
      unit = 'day';
    } else if (activeTab === 'weekly') {
      data = aggregateWeeklyData();
      label = 'Tempo de Estudo Semanal';
      unit = 'week';
    } else {
      data = aggregateMonthlyData();
      label = 'Tempo de Estudo Mensal';
      unit = 'month';
    }

    return {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: label,
          data: data.map(d => d.time / 3600000),
          fill: false,
          borderColor: 'rgb(245, 158, 11)',
          tension: 0.1,
        },
      ],
      unit: unit,
    };
  }, [activeTab, aggregateDailyData, aggregateWeeklyData, aggregateMonthlyData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
        },
      },
      title: {
        display: false,
        text: 'Evolução no Tempo',
        color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: chartData.unit,
          displayFormats: {
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MM/yyyy',
          },
        },
        title: {
          display: true,
          text: 'Data',
          color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
        },
        ticks: {
          color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Horas de Estudo',
          color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
        },
        ticks: {
          color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
        },
        beginAtZero: true
      },
    },
  }), [chartData.unit, theme]);

  const openRegisterModalForNew = () => {
    setSelectedTopic(null);
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const openRegisterModalForTopic = (topic: Topic) => {
    setSelectedTopic({ subject: subjectName, topic });
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const handleSaveStudy = (record: StudyRecord) => {
    if (editingRecord) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }
    setIsRegisterModalOpen(false);
    setEditingRecord(null);
    setSelectedTopic(null);
  };

  const handleEditRecord = (record: StudyRecord) => {
    setEditingRecord(record);
    setSelectedTopic(null);
    setIsRegisterModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      deleteStudyRecord(id);
    }
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setEditingRecord(null);
    setSelectedTopic(null);
  };

  // Componente recursivo para renderizar cada linha de tópico
  const TopicRow: React.FC<{ topic: Topic; subjectName: string; level: number; onOpenRegisterModal: (topic: Topic) => void; allTopicsExpanded: boolean }> = ({ topic, subjectName, level, onOpenRegisterModal, allTopicsExpanded }) => {
    const { studyRecords } = useData(); // Access studyRecords from context
    const filteredStudyRecords = useMemo(() => {
      return studyRecords.filter(record => record.subject === subjectName);
    }, [studyRecords, subjectName]);
    const isTopicStudied = filteredStudyRecords.some(record => record.topic === topic.topic_text);
    useEffect(() => {
      setIsExpanded(allTopicsExpanded);
    }, [allTopicsExpanded]);
    const [isExpanded, setIsExpanded] = useState(allTopicsExpanded); // State for collapse/expand
    const hasSubtopics = topic.sub_topics && topic.sub_topics.length > 0;
    const isGroupingTopic = topic.is_grouping_topic || hasSubtopics; // Fallback for older data

    return (
      <React.Fragment>
        <tr className={`${isGroupingTopic ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
          <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 whitespace-nowrap text-gray-800 dark:text-gray-200" style={{ paddingLeft: `${level * 20 + 16}px` }}>
            <div className="flex items-center">
              {hasSubtopics && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2 text-gray-500 dark:text-gray-400 focus:outline-none">
                  {isExpanded ? <FaCaretDown /> : <FaCaretRight />}
                </button>
              )}
              {topic.topic_number && <span className="mr-2 text-gray-500 dark:text-gray-400">{topic.topic_number}</span>}
              <span className={`${isGroupingTopic ? 'font-bold' : ''}`}>
                {isGroupingTopic ? `* ${topic.topic_text}` : topic.topic_text}
              </span>
            </div>
          </td>
          <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isTopicStudied ? 'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200' : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'}`}>
              {isTopicStudied ? 'Concluído' : 'Pendente'}
            </span>
          </td>
          <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
            <button 
              onClick={() => onOpenRegisterModal(topic)} 
              className={`p-2 rounded-full ${isGroupingTopic ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'}`}
              disabled={isGroupingTopic}
              title={isGroupingTopic ? 'Este é um tópico de agrupamento e não pode ser selecionado para estudo.' : 'Adicionar registro de estudo'}
            >
              <FaPlusCircle size={20} />
            </button>
          </td>
        </tr>
        {isExpanded && hasSubtopics && topic.sub_topics.map((subTopic, index) => (
          <TopicRow key={index} topic={subTopic} subjectName={subjectName} level={level + 1} onOpenRegisterModal={onOpenRegisterModal} allTopicsExpanded={allTopicsExpanded} />
        ))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Carregando detalhes da matéria...</p>
      </div>
    );
  }

  if (!currentSubject) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Matéria não encontrada neste plano.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      <div className="w-full">
        {/* Cabeçalho Padronizado */}
        <div className="mb-6">
          <header className="flex justify-between items-center pt-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{subjectName}</h1>
            {banca && <p className="text-md text-gray-700 dark:text-gray-200 mt-1">Banca: <span className="font-semibold">{banca}</span></p>}
            <div className="flex items-center space-x-4">
              <button
                onClick={openRegisterModalForNew}
                className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
              >
                <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
                <span className="relative flex items-center">
                  <FaPlusCircle className="mr-2 text-lg" />
                  Adicionar
                </span>
              </button>
              <select
                value={selectedDataFile || ''}
                onChange={(e) => setSelectedDataFile(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-amber-500 dark:border-amber-400 rounded-full py-2 px-4 text-amber-700 dark:text-amber-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-md text-base font-medium appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 20 20%22 fill%3D%22%23A3BFFA%22%3E%3Cpath fill-rule%3D%22evenodd%22 d%3D%22M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z%22 clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
              >
                {availablePlans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan.replace('.json', '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </header>
          <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-600" />
        </div>

        {/* Quatro Seções Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Tempo de Estudo</h3>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatTime(totalStudyTime)}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Desempenho</h3>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalCorrectQuestions} acertos</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalIncorrectQuestions} erros</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{performancePercentage}%</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Progresso no Edital</h3>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{studiedTopics} tópicos concluídos</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{pendingTopics > 0 ? pendingTopics : 0} tópicos pendentes</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{progressPercentage}%</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Páginas Lidas</h3>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{pagesReadPerHour} páginas/hora</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPagesRead}</p>
          </div>
        </div>

        {/* Histórico de Registros */}
        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md mb-8 min-h-[256px]">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Histórico de Registros</h2>
          {filteredStudyRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Nenhum registro de estudo para esta matéria ainda.</p>
              <button
                onClick={openRegisterModalForNew}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <FaPlusCircle />
                Adicionar Primeiro Registro
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Data</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tópico</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tempo</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acertos</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Erros</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Páginas</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudyRecords.map((record, index) => (
                    <tr key={record.id || index} className="bg-white dark:bg-gray-700">
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 whitespace-nowrap text-gray-800 dark:text-gray-200">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{record.topic}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 whitespace-nowrap text-gray-800 dark:text-gray-200">{formatTime(record.studyTime)}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 font-semibold">{record.questions?.correct || 0}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 font-semibold">{(record.questions?.total || 0) - (record.questions?.correct || 0)}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{record.pagesRead || '-'}</td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                        <button onClick={() => handleEditRecord(record)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 mr-2">Editar</button>
                        <button onClick={() => handleDeleteRecord(record.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evolução no Tempo */}
        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md mb-8 min-h-[400px]">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Evolução no Tempo</h2>
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-l-lg ${activeTab === 'daily' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
            >
              Diário
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 ${activeTab === 'weekly' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-r-lg ${activeTab === 'monthly' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
            >
              Mensal
            </button>
          </div>
          <div className="h-80">
            {filteredStudyRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-300">Nenhum registro de estudo para gerar o gráfico.</p>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Edital Verticalizado */}
        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md min-h-[256px]">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Edital Verticalizado</h2>
          {currentSubject.topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-300">Nenhum tópico cadastrado para esta matéria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => setAllTopicsExpanded(prev => !prev)}
                        className="mr-2 text-gray-500 dark:text-gray-400 focus:outline-none"
                        title={allTopicsExpanded ? 'Minimizar Todos' : 'Maximizar Todos'}
                      >
                        {allTopicsExpanded ? <FaCaretDown /> : <FaCaretRight />}
                      </button>
                      Tópico
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubject.topics.map((topic, index) => (
                    <TopicRow
                      key={index}
                      topic={topic}
                      subjectName={subjectName}
                      level={0}
                      onOpenRegisterModal={openRegisterModalForTopic}
                      allTopicsExpanded={allTopicsExpanded}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <StudyRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        onSave={handleSaveStudy}
        initialRecord={editingRecord}
        topic={selectedTopic}
        showDeleteButton={!!editingRecord?.id}
      />
    </div>
  );
}