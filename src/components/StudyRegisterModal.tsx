'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
import { getJsonContent } from '../app/actions';
import { useData, EditalTopic } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { StudyRecord } from '@/context/DataContext';
import AddReviewModal from './AddReviewModal';
import AddSubjectModal from './AddSubjectModal';
import { FaInfoCircle } from 'react-icons/fa';

// --- INTERFACES HIERÁRQUICAS ATUALIZADAS ---
interface Topic extends EditalTopic {}

interface Subject {
  subject: string;
  topics: Topic[];
  color?: string;
}

interface Video {
  title: string;
  start: string;
  end: string;
}

interface Page {
  start: number;
  end: number;
}

interface Question {
  correct: number;
  incorrect: number;
}

interface StudyRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: StudyRecord) => void;
  initialRecord?: Partial<StudyRecord> | null;
  topic?: { subject: string; topic: Topic } | null;
  initialTime?: number;
  justification?: string | null;
  showDeleteButton?: boolean;
}

const JustificationDetails: React.FC<{ justification: string }> = ({ justification }) => {
    const cleanedJustification = justification.replace(/^Prioridade: /, '').replace(/\.$/, '');
    const parts = cleanedJustification.split(', ');
    let details = parts.map(part => {
        const match = part.match(/(.+) \((.+)\)/);
        if (match) {
            const [, name, value] = match;
            return { name, value };
        }
        return null;
    }).filter(Boolean) as { name: string; value: string }[];

    const hasHistory = details.length > 0;
    if (!hasHistory) {
        return <p className="text-sm text-purple-700 dark:text-purple-300">Ainda não há dados de estudo para gerar uma sugestão detalhada.</p>;
    }
    const hasStudied = !details.some(d => d.name === 'Frequência' && d.value === '0x');
    details = details.map(detail => {
        let { name, value } = detail;
        if (name === 'Frequência') value = value === '0x' ? 'Nenhuma vez' : value.replace('x', ' vezes');
        if (name === 'Último Estudo') value = value.includes('999d') ? 'Nunca estudado' : value.replace('d', ' dias atrás');
        if (name === 'Taxa de Acertos' && !hasStudied) value = 'Sem histórico';
        return { name, value };
    });

    return (
        <div className="text-sm text-purple-700 dark:text-purple-300">
            <p className="font-semibold mb-2">Este tópico foi sugerido com base nos seguintes critérios:</p>
            <ul className="list-disc list-inside space-y-1">
                {details.map((detail, index) => (
                    <li key={index}>
                        <span className="font-semibold">{detail.name}:</span>
                        <span className="ml-2">{detail.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TopicSelectItem: React.FC<{ 
  topic: Topic;
  level: number;
  onSelect: (topicText: string) => void;
}> = ({ topic, level, onSelect }) => {
  const isGroupingTopic = topic.is_grouping_topic || (topic.sub_topics && topic.sub_topics.length > 0);

  const handleClick = () => {
    if (!isGroupingTopic) {
      onSelect(topic.topic_text);
    }
  };

  return (
    <Fragment>
      <div
        onClick={handleClick}
        className={`text-gray-900 dark:text-gray-200 select-none relative py-2 pr-9 ${isGroupingTopic ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:bg-gold-100 dark:hover:bg-gold-800'}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        title={isGroupingTopic ? 'Este é um tópico de agrupamento e não pode ser selecionado.' : topic.topic_text}
      >
        <span className={`block whitespace-normal ${isGroupingTopic ? 'font-bold' : ''}`}>
          {isGroupingTopic ? `* ${topic.topic_text}` : topic.topic_text}
        </span>
      </div>
      {topic.sub_topics && topic.sub_topics.map((subTopic, index) => (
        <TopicSelectItem 
          key={index} 
          topic={subTopic} 
          level={level + 1} 
          onSelect={onSelect} 
        />
      ))}
    </Fragment>
  );
};

const StudyRegisterModal: React.FC<StudyRegisterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  topic: initialTopicData,
  initialTime: initialStudyTime,
  justification,
  showDeleteButton = false, 
}) => {
  const getLocalYYYYMMDD = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    }
    return 0;
  };

  const { selectedDataFile, deleteStudyRecord, cycleGenerationTimestamp, saveSubject } = useData();
  const { showNotification } = useNotification();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isTeoriaFinalizada, setIsTeoriaFinalizada] = useState(false);
  const [countInPlanning, setCountInPlanning] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [studyTime, setStudyTime] = useState('00:00:00');
  const [isReviewSchedulingEnabled, setIsReviewSchedulingEnabled] = useState(false);
  const [reviewPeriods, setReviewPeriods] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD());
  const [questions, setQuestions] = useState<Question[]>([{ correct: 0, incorrect: 0 }]);
  const [pages, setPages] = useState<Page[]>([{ start: 0, end: 0 }]);
  const [videos, setVideos] = useState<Video[]>([{ title: '', start: '00:00:00', end: '00:00:00' }]);
  const [material, setMaterial] = useState('');
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [refreshSubjects, setRefreshSubjects] = useState(0);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: 'teoria', label: 'Teoria' },
    { value: 'revisao', label: 'Revisão' },
    { value: 'questoes', label: 'Questões' },
    { value: 'leitura_lei', label: 'Leitura de Lei' },
    { value: 'jurisprudencia', label: 'Jurisprudência' },
  ];

  const handleDateSelect = (type: 'today' | 'yesterday') => {
    const today = new Date();
    let dateToSet = today;
    if (type === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      dateToSet = yesterday;
    }
    setSelectedDate(getLocalYYYYMMDD(dateToSet));
    setShowDatePicker(false);
  };

  const resetForm = () => {
    setSelectedSubject('');
    setSelectedTopic('');
    setIsTeoriaFinalizada(false);
    setCountInPlanning(true);
    setSelectedCategory('');
    setStudyTime('00:00:00');
    setIsReviewSchedulingEnabled(false);
    setReviewPeriods([]);
    setSelectedDate(getLocalYYYYMMDD());
    setQuestions([{ correct: 0, incorrect: 0 }]);
    setPages([{ start: 0, end: 0 }]);
    setVideos([{ title: '', start: '00:00:00', end: '00:00:00' }]);
    setMaterial('');
    setComments('');
    setErrors({});
    setShowDatePicker(false);
  };

  useEffect(() => {
    const fetchEditalData = async () => {
      if (selectedDataFile) {
        try {
          const data = await getJsonContent(selectedDataFile);
          let loadedSubjects: Subject[] = [];
          if (Array.isArray(data)) {
            loadedSubjects = data;
          } else if (data && typeof data === 'object' && Array.isArray(data.subjects)) {
            loadedSubjects = data.subjects;
          }
          setSubjects(loadedSubjects);
        } catch (error) {
          console.error('Error fetching edital data:', error);
          setSubjects([]);
        }
      } else {
        setSubjects([]);
      }
    };
    fetchEditalData();
  }, [selectedDataFile, refreshSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      const subjectData = subjects.find(s => s.subject === selectedSubject);
      setTopics(subjectData?.topics || []);
    } else {
      setTopics([]);
    }
  }, [selectedSubject, subjects]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (initialRecord) {
        setSelectedSubject(initialRecord.subject || '');
        setSelectedTopic(initialRecord.topic || '');
        setIsTeoriaFinalizada(initialRecord.teoriaFinalizada ?? false);
        setCountInPlanning(initialRecord.countInPlanning ?? true);
        setSelectedCategory(initialRecord.category || '');
        setStudyTime(formatTime(initialRecord.studyTime || 0));
        setIsReviewSchedulingEnabled(!!initialRecord.reviewPeriods?.length);
        setReviewPeriods(initialRecord.reviewPeriods ?? []);
        setSelectedDate(initialRecord.date || getLocalYYYYMMDD());
        const today = getLocalYYYYMMDD();
        const yesterday = getLocalYYYYMMDD(new Date(new Date().setDate(new Date().getDate() - 1)));
        setShowDatePicker(initialRecord.date && initialRecord.date !== today && initialRecord.date !== yesterday);
        const total = initialRecord.questions?.total || 0;
        const correct = initialRecord.questions?.correct || 0;
        setQuestions([{ correct: correct, incorrect: total - correct }]);
        setPages(initialRecord.pages && initialRecord.pages.length > 0 ? initialRecord.pages : [{ start: 0, end: 0 }]);
        setVideos(initialRecord.videos && initialRecord.videos.length > 0 ? initialRecord.videos : [{ title: '', start: '00:00:00', end: '00:00:00' }]);
        setComments(initialRecord.notes || '');
      } else if (initialTopicData) {
        setSelectedSubject(initialTopicData.subject);
        setSelectedTopic(initialTopicData.topic.topic_text);
        setStudyTime(formatTime(initialStudyTime || 0));
      } else {
        setStudyTime(formatTime(initialStudyTime || 0));
      }
    }
  }, [isOpen, initialRecord, initialTopicData, initialStudyTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) setIsCategoryDropdownOpen(false);
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) setIsSubjectDropdownOpen(false);
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) setIsTopicDropdownOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const addPagePair = () => setPages([...pages, { start: 0, end: 0 }]);
  const addVideoRow = () => setVideos([...videos, { title: '', start: '00:00:00', end: '00:00:00' }]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!selectedSubject) newErrors.subject = 'Selecione uma disciplina';
    if (!selectedCategory) newErrors.category = 'Selecione uma categoria';
    if (!studyTime || studyTime === '00:00:00') newErrors.studyTime = 'Informe o tempo de estudo';
    if (!timeRegex.test(studyTime)) newErrors.studyTime = 'Formato de tempo inválido (use HH:MM:SS)';
    if (selectedSubject && !selectedTopic && topics.length > 0) newErrors.topic = 'Selecione um tópico';
    pages.forEach((page, index) => {
      if (page.start < 0 || page.end < 0) newErrors[`page-${index}`] = 'Páginas não podem ser negativas';
      if (page.end < page.start) newErrors[`page-${index}`] = 'Página final deve ser maior ou igual à inicial';
    });
    videos.forEach((video, index) => {
      const hasInfo = video.title.trim() || video.start !== '00:00:00' || video.end !== '00:00:00';
      if (hasInfo) {
        if (!video.title.trim()) newErrors[`video-title-${index}`] = 'Título do vídeo é obrigatório';
        if (!timeRegex.test(video.start) || !timeRegex.test(video.end)) newErrors[`video-time-${index}`] = 'Formato de tempo inválido (HH:MM:SS)';
        if (parseTime(video.end) <= parseTime(video.start)) newErrors[`video-time-${index}`] = 'Tempo final deve ser maior que o inicial';
      }
    });
    questions.forEach((q, index) => {
      if (q.correct < 0 || q.incorrect < 0) newErrors[`question-${index}`] = 'Valores não podem ser negativos';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (countInPlanning && cycleGenerationTimestamp) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const recordDate = new Date(Date.UTC(year, month - 1, day));
  
      const cycleCreationDate = new Date(cycleGenerationTimestamp);
      cycleCreationDate.setUTCHours(0, 0, 0, 0);
  
      if (recordDate.getTime() < cycleCreationDate.getTime()) {
        showNotification('Não é possível contabilizar um estudo anterior à criação do planejamento.', 'error');
        return;
      }
    }

    const studyRecord: StudyRecord = {
      id: initialRecord?.id || '',
      date: selectedDate,
      subject: selectedSubject,
      topic: selectedTopic,
      studyTime: parseTime(studyTime),
      questions: { correct: questions[0].correct, total: questions[0].correct + questions[0].incorrect },
      notes: comments,
      category: selectedCategory,
      reviewPeriods: isReviewSchedulingEnabled ? reviewPeriods : undefined,
      teoriaFinalizada: isTeoriaFinalizada,
      countInPlanning: countInPlanning,
      pages: pages.filter(p => p.start > 0 || p.end > 0),
      videos: videos.filter(v => v.title),
    };
    onSave(studyRecord);
    onClose();
  };

  const handleDelete = () => {
    if (initialRecord?.id && window.confirm('Tem certeza que deseja excluir este registro?')) {
      deleteStudyRecord(initialRecord.id);
      onClose();
    }
  };

  const handleAddReview = (days: number) => {
    setReviewPeriods(prev => [...prev, `${days}d`]);
    setIsAddReviewModalOpen(false);
  };

  const handleAddSubject = async (subjectName: string, topics: Topic[], color: string) => {
    if (!saveSubject) return;

    const result = await saveSubject({ subject: subjectName, topics, color });

    if (result.success) {
      setIsAddSubjectModalOpen(false);
      setSelectedSubject(subjectName);
      setRefreshSubjects(prev => prev + 1);
      // A atualização da lista de matérias agora é tratada pelo refreshPlans no DataContext
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-gold-200 bg-gold-50 dark:border-gold-700 dark:bg-gold-900">
            <h2 className="text-xl font-bold text-gold-800 dark:text-gold-200">Registro de Estudo</h2>
            <button onClick={onClose} className="text-gold-600 hover:text-gold-800 text-2xl font-bold dark:text-gold-400 dark:hover:text-gold-200">&times;</button>
          </div>
          <div className="p-6 space-y-6 dark:text-gray-100">
            {justification && (
              <div className="p-4 mb-4 bg-purple-100 border-l-4 border-purple-500 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-400 rounded-r-lg">
                <div className="flex">
                  <div className="py-1"><FaInfoCircle className="h-5 w-5 text-purple-500 mr-3" /></div>
                  <div>
                    <p className="font-bold">Sugestão do Algoritmo</p>
                    <JustificationDetails justification={justification} />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2 mb-4">
              <button onClick={() => handleDateSelect('today')} className={`py-2 px-4 rounded-lg font-semibold ${selectedDate === new Date().toISOString().split('T')[0] && !showDatePicker ? 'bg-gold-600 text-white dark:bg-gold-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}>Hoje</button>
              <button onClick={() => handleDateSelect('yesterday')} className={`py-2 px-4 rounded-lg font-semibold ${selectedDate === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0] && !showDatePicker ? 'bg-gold-600 text-white dark:bg-gold-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}>Ontem</button>
              <button onClick={() => setShowDatePicker(true)} className={`py-2 px-4 rounded-lg font-semibold ${showDatePicker ? 'bg-gold-600 text-white dark:bg-gold-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}>Outro</button>
              {showDatePicker && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="py-2 px-3 rounded-lg font-semibold border-gray-300 border focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <div className="relative" ref={categoryDropdownRef}>
                  <button type="button" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-left text-base border-2 ${errors.category ? 'border-red-500' : 'border-gold-500 dark:border-gold-700'} focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-100`}>
                    <span className="block truncate text-gray-700 dark:text-gray-100">{categories.find(c => c.value === selectedCategory)?.label || 'Selecione...'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg></span>
                  </button>
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {categories.map((cat) => (
                        <div key={cat.value} onClick={() => { setSelectedCategory(cat.value); setIsCategoryDropdownOpen(false); }} className="text-gray-900 dark:text-gray-200 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gold-100 dark:hover:bg-gold-800">
                          <span className="block whitespace-normal">{cat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow" ref={subjectDropdownRef}>
                    <button type="button" onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-left text-base border-2 ${errors.subject ? 'border-red-500' : 'border-gold-500 dark:border-gold-700'} focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-100`}>
                      <span className="block truncate text-gray-700 dark:text-gray-100">{selectedSubject || 'Selecione...'}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg></span>
                    </button>
                    {isSubjectDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {subjects.map((sub, index) => (
                          <div key={index} onClick={() => { setSelectedSubject(sub.subject); setIsSubjectDropdownOpen(false); setSelectedTopic(''); }} className="text-gray-900 dark:text-gray-200 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gold-100 dark:hover:bg-gold-800">
                            <span className="block whitespace-normal">{sub.subject}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsAddSubjectModalOpen(true)} className="mt-1 bg-gold-500 hover:bg-gold-600 text-white font-bold py-2 px-3 rounded-md text-lg dark:bg-gold-600 dark:hover:bg-gold-700">+</button>
                </div>
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
              </div>
              <div>
                <label htmlFor="studyTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tempo de Estudo</label>
                <input type="text" id="studyTime" value={studyTime} onChange={(e) => setStudyTime(e.target.value)} className={`mt-1 block w-full border ${errors.studyTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} placeholder="HH:MM:SS" />
                {errors.studyTime && <p className="mt-1 text-sm text-red-600">{errors.studyTime}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tópico</label>
                <div className="relative" ref={topicDropdownRef}>
                  <button type="button" disabled={!selectedSubject} onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)} className={`mt-1 block w-full pl-3 pr-10 py-2 text-left text-base border-2 ${errors.topic ? 'border-red-500' : 'border-gold-500 dark:border-gold-700'} focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm rounded-md disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed bg-white dark:bg-gray-700 dark:text-gray-100`}>
                    <span className="block truncate text-gray-700 dark:text-gray-100">{selectedTopic || 'Selecione um tópico...'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg></span>
                  </button>
                  {isTopicDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {topics.map((topic, index) => (
                        <TopicSelectItem 
                          key={index} 
                          topic={topic} 
                          level={0} 
                          onSelect={(topicText) => {
                            setSelectedTopic(topicText);
                            setIsTopicDropdownOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {errors.topic && <p className="mt-1 text-sm text-red-600">{errors.topic}</p>}
              </div>
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material</label>
                <input type="text" id="material" placeholder="Ex.: Aula 01" value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm" />
              </div>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
              <div className="flex justify-between w-full">
                <div className="flex items-center">
                  <input id="teoriaFinalizada" type="checkbox" className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 accent-gold-500" checked={isTeoriaFinalizada} onChange={(e) => setIsTeoriaFinalizada(e.target.checked)} />
                  <label htmlFor="teoriaFinalizada" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Teoria Finalizada</label>
                </div>
                <div className="flex items-center">
                  <input id="countInPlanning" type="checkbox" className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 accent-gold-500" checked={countInPlanning} onChange={(e) => setCountInPlanning(e.target.checked)} />
                  <label htmlFor="countInPlanning" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Contabilizar no Planejamento</label>
                </div>
              </div>
              <div className="flex items-center">
                <input id="programarRevisoes" type="checkbox" className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 accent-gold-500" checked={isReviewSchedulingEnabled} onChange={(e) => setIsReviewSchedulingEnabled(e.target.checked)} />
                <label htmlFor="programarRevisoes" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Programar Revisões</label>
              </div>
            </div>
            {isReviewSchedulingEnabled && (
              <div className="flex flex-wrap gap-2 mt-2">
                {reviewPeriods.map((period, index) => (
                  <span key={index} className="bg-gold-100 text-gold-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center dark:bg-gold-800 dark:text-gold-100">
                    {period}
                    <button onClick={() => setReviewPeriods(prev => prev.filter((_, i) => i !== index))} className="ml-2 text-gold-600 hover:text-gold-800 dark:text-gold-300 dark:hover:text-gold-100">&times;</button>
                  </span>
                ))}
                <div className="ml-2"><button onClick={() => setIsAddReviewModalOpen(true)} className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-1 px-2 rounded-full text-xs dark:bg-gold-600 dark:hover:bg-gold-700">+</button></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-gold-300 dark:border-gold-700 p-4 rounded-md md:col-span-1">
                <h3 className="text-lg font-semibold text-gold-800 dark:text-gold-200 mb-3">Questões</h3>
                {questions.map((q, index) => (
                  <div key={index} className="flex space-x-2 mb-2 w-full">
                    <div className="flex-1">
                      <label htmlFor={`acertos-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acertos</label>
                      <input type="number" id={`acertos-${index}`} value={q.correct} min="0" onChange={(e) => { const newQuestions = [...questions]; newQuestions[index].correct = parseInt(e.target.value) || 0; setQuestions(newQuestions); }} className={`mt-1 block w-full border ${errors[`question-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} />
                      {errors[`question-${index}`] && <p className="mt-1 text-sm text-red-600">{errors[`question-${index}`]}</p>}
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`erros-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Erros</label>
                      <input type="number" id={`erros-${index}`} value={q.incorrect} min="0" onChange={(e) => { const newQuestions = [...questions]; newQuestions[index].incorrect = parseInt(e.target.value) || 0; setQuestions(newQuestions); }} className={`mt-1 block w-full border ${errors[`question-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-gold-300 dark:border-gold-700 p-4 rounded-md md:col-span-1 relative">
                <h3 className="text-lg font-semibold text-gold-800 dark:text-gold-200 mb-3">Páginas</h3>
                {pages.map((p, index) => (
                  <div key={index} className="flex space-x-2 mb-2 w-full">
                    <div className="flex-1">
                      <label htmlFor={`inicio-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Início</label>
                      <input type="number" id={`inicio-${index}`} value={p.start} min="0" onChange={(e) => { const newPages = [...pages]; newPages[index].start = parseInt(e.target.value) || 0; setPages(newPages); }} className={`mt-1 block w-full border ${errors[`page-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`fim-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fim</label>
                      <input type="number" id={`fim-${index}`} value={p.end} min="0" onChange={(e) => { const newPages = [...pages]; newPages[index].end = parseInt(e.target.value) || 0; setPages(newPages); }} className={`mt-1 block w-full border ${errors[`page-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} />
                      {errors[`page-${index}`] && <p className="mt-1 text-sm text-red-600">{errors[`page-${index}`]}</p>}
                    </div>
                  </div>
                ))}
                <button onClick={addPagePair} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-1 px-2 rounded-full text-xs z-10 dark:bg-gold-600 dark:hover:bg-gold-700">+</button>
              </div>
              <div className="border border-gold-300 dark:border-gold-700 p-4 rounded-md md:col-span-2 relative">
                <h3 className="text-lg font-semibold text-gold-800 dark:text-gold-200 mb-3">Vídeo/Aulas</h3>
                {videos.map((v, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label htmlFor={`video-title-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                      <input type="text" id={`video-title-${index}`} value={v.title} onChange={(e) => { const newVideos = [...videos]; newVideos[index] = { ...newVideos[index], title: e.target.value }; setVideos(newVideos); }} className={`mt-1 block w-full border ${errors[`video-title-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} />
                      {errors[`video-title-${index}`] && <p className="mt-1 text-sm text-red-600">{errors[`video-title-${index}`]}</p>}
                    </div>
                    <div>
                      <label htmlFor={`video-start-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Início</label>
                      <input type="text" id={`video-start-${index}`} value={v.start} onChange={(e) => { const newVideos = [...videos]; newVideos[index] = { ...newVideos[index], start: e.target.value }; setVideos(newVideos); }} className={`mt-1 block w-full border ${errors[`video-time-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} placeholder="HH:MM:SS" />
                    </div>
                    <div>
                      <label htmlFor={`video-end-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fim</label>
                      <input type="text" id={`video-end-${index}`} value={v.end} onChange={(e) => { const newVideos = [...videos]; newVideos[index] = { ...newVideos[index], end: e.target.value }; setVideos(newVideos); }} className={`mt-1 block w-full border ${errors[`video-time-${index}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm`} placeholder="HH:MM:SS" />
                      {errors[`video-time-${index}`] && <p className="mt-1 text-sm text-red-600">{errors[`video-time-${index}`]}</p>}
                    </div>
                  </div>
                ))}
                <button onClick={addVideoRow} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-1 px-2 rounded-full text-xs z-10 dark:bg-gold-600 dark:hover:bg-gold-700">+</button>
              </div>
            </div>
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comentários</label>
              <textarea id="comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"></textarea>
            </div>
          </div>
          <div className="flex justify-end items-center p-4 border-t border-gold-200 dark:border-gold-700 bg-gold-50 dark:bg-gold-900/50 space-x-4">
            {initialRecord && showDeleteButton && (<button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg dark:bg-red-600 dark:hover:bg-red-700">Excluir</button>)}
            <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancelar</button>
            <button onClick={handleSave} className="bg-gold-600 hover:bg-gold-700 text-white font-bold py-2 px-4 rounded-lg dark:bg-gold-700 dark:hover:bg-gold-800">Salvar</button>
          </div>
        </div>
        {isAddReviewModalOpen && (<AddReviewModal isOpen={isAddReviewModalOpen} onClose={() => setIsAddReviewModalOpen(false)} onSave={handleAddReview} />)}
        <AddSubjectModal 
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          onSave={handleAddSubject}
        />
      </div>
    </>
  );
};

export default StudyRegisterModal;