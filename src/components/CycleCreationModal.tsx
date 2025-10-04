'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PlanData, updateAllTopicWeightsAction, renameSubjectAction } from '../app/actions';
import { useNotification } from '../context/NotificationContext';
import { FaMagic, FaTools, FaSearch, FaTimes, FaStar, FaClock, FaCalendarAlt, FaHourglassHalf, FaQuestionCircle, FaCheckCircle, FaCopy, FaHandSparkles } from 'react-icons/fa';
import TopicWeightsModal from './TopicWeightsModal';

// Interfaces
interface Subject {
  id: string;
  subject: string;
  topics: Topic[];
  color: string;
}

interface Topic {
  topic_text: string;
  userWeight?: number;
  sub_topics?: Topic[];
  is_grouping_topic?: boolean;
}

interface SubjectSettings {
  [subjectId: string]: { importance: number; knowledge: number };
}
interface StudySession {
  id: any;
  subjectId: string;
  subject: string;
  duration: number;
  color: string;
}

interface CycleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  initialData?: {
    studyHours: string;
    weeklyQuestionsGoal: string;
    subjectSettings: SubjectSettings;
    selectedSubjects: string[];
    minSession: string;
    maxSession: string;
    studyDays: string[];
  };
}

const CycleCreationModal: React.FC<CycleCreationModalProps> = ({ isOpen, onClose, isEditing = false, initialData }) => {
  const { 
    generateStudyCycle, 
    selectedDataFile, 
    setStudyCycle, 
    setCurrentProgressMinutes, 
    setCompletedCycles, 
    setSessionProgressMap, 
    studyHours: dataContextStudyHours, 
    weeklyQuestionsGoal: dataContextWeeklyQuestionsGoal, 
    setStudyHours: setContextStudyHours, 
    setWeeklyQuestionsGoal: setContextWeeklyQuestionsGoal, 
    setStudyDays: setContextStudyDays,
    stats,
    studyPlans,
    availablePlans,
    updateTopicWeight, // Usaremos a função do contexto para otimismo
    refreshPlans
  } = useData();
  
  const { showNotification } = useNotification();
  const [modalStep, setModalStep] = useState(0);
  
  // Remove o estado local de subjects e bancaTopicWeights
  // Os dados agora vêm diretamente do DataContext
  const subjects = useMemo(() => stats.editalData || [], [stats.editalData]);
  const currentPlan = useMemo(() => {
    const planIndex = availablePlans.indexOf(selectedDataFile);
    return planIndex !== -1 ? studyPlans[planIndex] : null;
  }, [selectedDataFile, availablePlans, studyPlans]);
  const bancaTopicWeights = useMemo(() => currentPlan?.bancaTopicWeights || null, [currentPlan]);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectSettings, setSubjectSettings] = useState<SubjectSettings>({});
  const [studyHours, setStudyHours] = useState('40');
  const [studyDays, setStudyDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [minSession, setMinSession] = useState('60');
  const [maxSession, setMaxSession] = useState('120');
  const [weeklyQuestionsGoal, setWeeklyQuestionsGoal] = useState('250');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualStudySessions, setManualStudySessions] = useState<StudySession[]>([]);
  const [newManualSessionSubjectId, setNewManualSessionSubjectId] = useState('');
  const [newManualSessionDuration, setNewManualSessionDuration] = useState('60');
  const [isManualSubjectDropdownOpen, setIsManualSubjectDropdownOpen] = useState(false);
  const manualSubjectDropdownRef = React.useRef<HTMLDivElement>(null);

  const [isTopicWeightsModalOpen, setIsTopicWeightsModalOpen] = useState(false);
  const [selectedSubjectForWeights, setSelectedSubjectForWeights] = useState<Subject | null>(null);

  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setStudyHours(initialData.studyHours || dataContextStudyHours);
        setWeeklyQuestionsGoal(initialData.weeklyQuestionsGoal || dataContextWeeklyQuestionsGoal);
        setSelectedSubjectIds(initialData.selectedSubjects || []);
        setSubjectSettings(initialData.subjectSettings || {});
        setMinSession(initialData.minSession || '60');
        setMaxSession(initialData.maxSession || '120');
        setStudyDays(initialData.studyDays || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
        setModalStep(1);
      } else {
        setStudyHours(dataContextStudyHours || '40');
        setWeeklyQuestionsGoal(dataContextWeeklyQuestionsGoal || '250');
        setSelectedSubjectIds([]);
        setSubjectSettings({});
        setMinSession('60');
        setMaxSession('120');
        setStudyDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
        setModalStep(0);
      }
    }
  }, [isOpen, isEditing, initialData, dataContextStudyHours, dataContextWeeklyQuestionsGoal]);

  // Remove o useEffect que carregava os subjects localmente

  useEffect(() => {
    if (isOpen && selectedSubjectIds.length > 0) {
      setSubjectSettings(prevSettings => {
        const newSettings = { ...prevSettings };
        let changed = false;
        selectedSubjectIds.forEach(subjectId => {
          if (!newSettings[subjectId]) {
            newSettings[subjectId] = { importance: 3, knowledge: 3 };
            changed = true;
          }
        });
        return changed ? newSettings : prevSettings;
      });
    }
  }, [selectedSubjectIds, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (manualSubjectDropdownRef.current && !manualSubjectDropdownRef.current.contains(event.target as Node)) {
        setIsManualSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const percentages = useMemo(() => {
    const weights: { [key: string]: number } = {};
    let totalWeight = 0;
    Object.keys(subjectSettings).forEach(subjectId => {
      const { importance, knowledge } = subjectSettings[subjectId];
      const weight = importance / knowledge;
      weights[subjectId] = weight;
      totalWeight += weight;
    });
    const newPercentages: { [key: string]: string } = {};
    Object.keys(weights).forEach(subjectId => {
      newPercentages[subjectId] = totalWeight > 0 ? ((weights[subjectId] / totalWeight) * 100).toFixed(2) : '0.00';
    });
    return newPercentages;
  }, [subjectSettings]);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSettingChange = (subjectId: string, type: 'importance' | 'knowledge', value: number) => {
    setSubjectSettings(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], [type]: value } }));
  };

  const handleDaySelect = (day: string) => {
    setStudyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const validateNumericalInputs = () => {
    const hours = parseInt(studyHours);
    const min = parseInt(minSession);
    const max = parseInt(maxSession);
    const questionsGoal = parseInt(weeklyQuestionsGoal);

    if (isNaN(hours) || hours <= 0) {
      showNotification('Por favor, insira um número válido e positivo para as horas de estudo semanais.', 'error');
      return false;
    }
    if (isNaN(questionsGoal) || questionsGoal < 0) {
      showNotification('Por favor, insira um número válido e positivo para a meta de questões.', 'error');
      return false;
    }
    if (isNaN(min) || min <= 0) {
      showNotification('Por favor, insira um número válido e positivo para a duração mínima da sessão.', 'error');
      return false;
    }
    if (isNaN(max) || max <= 0) {
      showNotification('Por favor, insira um número válido e positivo para a duração máxima da sessão.', 'error');
      return false;
    }
    if (min > max) {
      showNotification('A duração mínima da sessão não pode ser maior que a duração máxima.', 'error');
      return false;
    }
    return true;
  };

  const handleGenerateCycle = () => {
    if (!validateNumericalInputs()) return;

    const selectedSubjectsData = subjects.filter(s => selectedSubjectIds.includes(s.id));

    generateStudyCycle({
      studyHours: parseInt(studyHours),
      minSession: parseInt(minSession),
      maxSession: parseInt(maxSession),
      subjectSettings,
      subjects: selectedSubjectsData,
      weeklyQuestionsGoal: weeklyQuestionsGoal,
    });
    setContextStudyDays(studyDays);
    onClose();
  };

  const handleCreateEmptyCycle = () => {
    setStudyCycle([]);
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setContextStudyHours(studyHours);
    setContextWeeklyQuestionsGoal(weeklyQuestionsGoal);
    onClose();
    showNotification('Ciclo de estudos em branco criado com sucesso! Você pode preenchê-lo manualmente.', 'success');
  };

  const handleAddManualSession = () => {
    if (!newManualSessionSubjectId || !newManualSessionDuration) {
      showNotification('Por favor, selecione uma matéria e insira a duração da sessão.', 'error');
      return;
    }
    const duration = parseInt(newManualSessionDuration);
    if (isNaN(duration) || duration <= 0) {
      showNotification('A duração da sessão deve ser um número positivo.', 'error');
      return;
    }

    const selectedSubjectData = subjectMap.get(newManualSessionSubjectId);
    if (!selectedSubjectData) return;

    const newSession: StudySession = {
      id: Date.now(),
      subjectId: selectedSubjectData.id,
      subject: selectedSubjectData.subject,
      duration: duration,
      color: selectedSubjectData.color || '#94A3B8',
    };

    setManualStudySessions(prev => [...prev, newSession]);
    setNewManualSessionSubjectId('');
    setNewManualSessionDuration('60');
    showNotification('Sessão adicionada com sucesso!', 'success');
  };

  const handleDuplicateManualSession = (sessionToDuplicate: StudySession) => {
    const newSession: StudySession = {
      ...sessionToDuplicate,
      id: Date.now() + Math.random(),
    };
    setManualStudySessions(prev => [...prev, newSession]);
    showNotification('Sessão duplicada com sucesso!', 'success');
  };

  const handleRemoveManualSession = (id: any) => {
    setManualStudySessions(prev => prev.filter(session => session.id !== id));
    showNotification('Sessão removida.', 'info');
  };

  const handleSaveManualCycle = () => {
    if (manualStudySessions.length === 0) {
      showNotification('Adicione pelo menos uma sessão para salvar o ciclo.', 'error');
      return;
    }
    const totalManualDurationMinutes = manualStudySessions.reduce((sum, session) => sum + session.duration, 0);
    setStudyCycle(manualStudySessions);
    setSessionProgressMap({});
    setCurrentProgressMinutes(0);
    setCompletedCycles(0);
    setContextStudyHours((totalManualDurationMinutes / 60).toFixed(1));
    setContextWeeklyQuestionsGoal(weeklyQuestionsGoal);
    setContextStudyDays(studyDays);
    onClose();
    showNotification('Ciclo de estudos manual salvo com sucesso!', 'success');
  };

  const openTopicWeightsModal = (subjectId: string) => {
    const subjectData = subjectMap.get(subjectId);
    if (subjectData) {
      setSelectedSubjectForWeights(subjectData);
      setIsTopicWeightsModalOpen(true);
    }
  };

  const handleCalculateWeights = async () => {
    if (!bancaTopicWeights || Object.keys(bancaTopicWeights).length === 0) {
      showNotification('Dados de questões por banca não encontrados. Importe o guia de estudos novamente.', 'error');
      return;
    }

    showNotification('Calculando e atualizando pesos dos tópicos...', 'info');

    try {
      const topicsWithCounts = selectedSubjectIds.flatMap(subjectId => {
        const subject = subjectMap.get(subjectId);
        if (!subject) return [];

        const topicList: { subjectId: string, topicText: string, count: number }[] = [];
        const traverse = (topics: Topic[]) => {
          topics.forEach(topic => {
            if (!topic.is_grouping_topic) {
              const count = bancaTopicWeights[subjectId]?.[topic.topic_text] ?? 0;
              topicList.push({ subjectId, topicText: topic.topic_text, count });
            }
            if (topic.sub_topics) {
              traverse(topic.sub_topics);
            }
          });
        };
        traverse(subject.topics);
        return topicList;
      });

      const zeroCountTopics = topicsWithCounts.filter(t => t.count === 0);
      const nonZeroCountTopics = topicsWithCounts.filter(t => t.count > 0);

      if (nonZeroCountTopics.length === 0) {
        showNotification('Nenhuma questão encontrada para as matérias selecionadas.', 'warning');
        return;
      }

      nonZeroCountTopics.sort((a, b) => a.count - b.count);

      const weightMap = new Map<string, number>();
      const total = nonZeroCountTopics.length;
      const binSize = Math.max(1, total / 5);

      nonZeroCountTopics.forEach((topic, index) => {
        const weight = Math.min(5, Math.floor(index / binSize) + 1);
        const key = `${topic.subjectId}::${topic.topicText}`;
        weightMap.set(key, weight);
      });

      zeroCountTopics.forEach(topic => {
        const key = `${topic.subjectId}::${topic.topicText}`;
        weightMap.set(key, 1);
      });

      const updatedSubjects = [...subjects];
      const newWeightsMap: { [subjectId: string]: { [topicText: string]: number } } = {};

      const updateTopicRecursively = (topics: Topic[], subjectId: string): Topic[] => {
        return topics.map(topic => {
          const key = `${subjectId}::${topic.topic_text}`;
          const newWeight = weightMap.get(key) ?? topic.userWeight ?? 1;

          if (topic.userWeight !== newWeight) {
            if (!newWeightsMap[subjectId]) {
              newWeightsMap[subjectId] = {};
            }
            newWeightsMap[subjectId][topic.topic_text] = newWeight;
          }

          const newSubTopics = topic.sub_topics ? updateTopicRecursively(topic.sub_topics, subjectId) : [];

          return {
            ...topic,
            userWeight: newWeight,
            sub_topics: newSubTopics,
          };
        });
      };

      selectedSubjectIds.forEach(subjectId => {
        const subjectIndex = updatedSubjects.findIndex(s => s.id === subjectId);
        if (subjectIndex !== -1) {
          updatedSubjects[subjectIndex].topics = updateTopicRecursively(updatedSubjects[subjectIndex].topics, subjectId);
        }
      });

      if (Object.keys(newWeightsMap).length > 0) {
        await updateAllTopicWeightsAction(selectedDataFile, newWeightsMap);
        await refreshPlans();
      }

      // setSubjects(updatedSubjects); // Removido pois a função não está definida neste escopo. A UI é atualizada via refreshPlans.
      showNotification('Pesos dos tópicos recalculados com sucesso!', 'success');

    } catch (error) {
      console.error("Erro ao calcular pesos:", error);
      showNotification('Ocorreu um erro ao atualizar os pesos.', 'error');
    }
  };

  const renderModalContent = () => {
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    switch (modalStep) {
      case 0:
        return (
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{isEditing ? 'Editar Ciclo de Estudos' : 'Criar Novo Ciclo de Estudos'}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Escolha como você prefere montar seu plano de estudos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => setModalStep(1)} className="group border-2 border-gray-200 hover:border-amber-500 p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 dark:border-gray-700 dark:hover:border-amber-400">
                <FaMagic className="text-4xl text-amber-500 mx-auto mb-4 transition-transform duration-300 group-hover:rotate-12 dark:text-amber-400" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Modo Guiado</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Nós guiaremos você passo a passo para criar um plano otimizado e personalizado.</p>
              </div>
              <div onClick={() => setModalStep(4)} className="group border-2 border-gray-200 hover:border-amber-500 p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 dark:border-gray-700 dark:hover:border-amber-400">
                <FaTools className="text-4xl text-amber-500 mx-auto mb-4 transition-transform duration-300 group-hover:rotate-12 dark:text-amber-400" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Modo Manual</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Crie seu ciclo de estudos adicionando sessões de estudo uma a uma.</p>
              </div>
            </div>
          </div>
        );
      case 1:
        const filteredSubjects = subjects.filter(s =>
          s.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Selecione as Matérias</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Clique nas matérias que você deseja incluir no seu ciclo de estudos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ minHeight: '400px' }}>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Matérias Disponíveis</h3>
                <div className="relative mb-4">
                  <label htmlFor="search-subject" className="sr-only">Buscar matéria</label>
                  <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    id="search-subject"
                    name="search-subject"
                    placeholder="Buscar matéria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                  />
                </div>
                <div className="flex items-center mb-3 pl-1">
                    <input
                        type="checkbox"
                        id="selectAll"
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 accent-amber-500"
                        onChange={() => {
                            const allSubjectIds = filteredSubjects.map(s => s.id);
                            const allSelected = allSubjectIds.every(id => selectedSubjectIds.includes(id));
                            if (allSelected) {
                                setSelectedSubjectIds(prev => prev.filter(id => !allSubjectIds.includes(id)));
                            } else {
                                setSelectedSubjectIds(prev => [...new Set([...prev, ...allSubjectIds])]);
                            }
                        }}
                        checked={filteredSubjects.length > 0 && filteredSubjects.every(s => selectedSubjectIds.includes(s.id))}
                    />
                    <label htmlFor="selectAll" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-100">
                        Selecionar Todas
                    </label>
                </div>
                <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: '260px' }}>
                  {filteredSubjects.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleSubjectSelect(s.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${selectedSubjectIds.includes(s.id) ? 'bg-amber-100 text-amber-800 font-semibold dark:bg-amber-800 dark:text-amber-100' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'}`}>
                      <span className="text-gray-800">{s.subject}</span>
                      {selectedSubjectIds.includes(s.id) && <FaCheckCircle className="text-amber-500 dark:text-amber-400" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Matérias Selecionadas ({selectedSubjectIds.length})</h3>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '340px' }}>
                  {selectedSubjectIds.length > 0 ? (
                    selectedSubjectIds.map(subjectId => {
                      const subject = subjectMap.get(subjectId);
                      if (!subject) return null;
                      return (
                        <div key={subjectId} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex justify-between items-center">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{subject.subject}</span>
                          <button onClick={() => handleSubjectSelect(subjectId)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                            <FaTimes />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 pt-16">
                      <p>Nenhuma matéria selecionada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={isEditing ? onClose : () => setModalStep(0)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={() => setModalStep(2)} className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700" disabled={selectedSubjectIds.length === 0}>Avançar</button>
            </div>
          </div>
        );
      case 2:
        const totalWeight = Object.values(subjectSettings).reduce((acc, { importance, knowledge }) => acc + (importance / (knowledge || 1)), 0);
        const StarRating = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <FaStar
                key={star}
                className={`cursor-pointer ${star <= value ? 'text-amber-400' : 'text-gray-300'}`}
                onClick={() => onChange(star)}
              />
            ))}
          </div>
        );
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Ajuste de Peso das Matérias</h2>
              <button
                onClick={handleCalculateWeights}
                className="relative flex items-center px-4 py-2 bg-gold-600 text-white font-semibold rounded-lg hover:bg-gold-700 transition-all duration-300 overflow-hidden group"
                title="Calcular pesos dos tópicos com base na quantidade de questões da banca."
              >
                <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
                <span className="relative flex items-center">
                  <FaMagic className="mr-2" />
                  Calcular Pesos por Banca
                </span>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Defina a importância e seu conhecimento em cada matéria para balancear o ciclo.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ minHeight: '400px' }}>
              <div className="space-y-4 overflow-y-auto pr-4" style={{ maxHeight: '450px' }}>
                {selectedSubjectIds.map(subjectId => {
                  const subject = subjectMap.get(subjectId);
                  if (!subject) return null;
                  return (
                    <div key={subjectId} className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600 relative">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">{subject.subject}</h3>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Importância</label>
                        <StarRating
                          value={subjectSettings[subjectId]?.importance || 3}
                          onChange={(value) => handleSettingChange(subjectId, 'importance', value)}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-100">Conhecimento</label>
                        <StarRating
                          value={subjectSettings[subjectId]?.knowledge || 3}
                          onChange={(value) => handleSettingChange(subjectId, 'knowledge', value)}
                        />
                      </div>
                      <button
                        onClick={() => openTopicWeightsModal(subjectId)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                        title="Ajustar relevância dos tópicos"
                      >
                        <FaHandSparkles />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-6 rounded-lg dark:bg-gray-700">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Distribuição do Tempo</h3>
                {totalWeight > 0 ? (
                  <DonutChartForModal data={percentages} subjects={subjects} />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-200 dark:bg-gray-600 rounded-full mx-auto flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Ajuste os pesos para ver o gráfico</p>
                  </div>
                )}
                <div className="w-full mt-6 space-y-2 overflow-y-auto" style={{ maxHeight: '180px' }}>
                  {Object.entries(percentages).map(([subjectId, percentage]) => {
                    const subject = subjectMap.get(subjectId);
                    if (!subject) return null;
                    return (
                      <div key={subjectId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.color }}></span>
                          <span className="text-gray-700 dark:text-gray-100">{subject.subject}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(1)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={() => setModalStep(3)} className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700">Avançar</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Planejamento Semanal</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Defina a estrutura do seu ciclo de estudos semanal.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="weeklyHours" className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaClock className="mr-3 text-amber-500" />
                    Horas Semanais
                  </label>
                  <input
                    type="number"
                    id="weeklyHours"
                    name="weeklyHours"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                    placeholder="Ex: 40"
                  />
                </div>
                <div>
                  <label htmlFor="weeklyQuestions" className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaQuestionCircle className="mr-3 text-amber-500" />
                    Meta de Questões
                  </label>
                  <input
                    type="number"
                    id="weeklyQuestions"
                    name="weeklyQuestions"
                    value={weeklyQuestionsGoal}
                    onChange={(e) => setWeeklyQuestionsGoal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                    placeholder="Ex: 250"
                  />
                </div>
                <div>
                  <label htmlFor="minSession" className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center">
                    <FaHourglassHalf className="mr-3 text-amber-500" />
                    Duração da Sessão (min)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      id="minSession"
                      name="minSession"
                      placeholder="Mínimo"
                      value={minSession}
                      onChange={(e) => setMinSession(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                    />
                    <span className="text-gray-500 font-bold dark:text-gray-400">-</span>
                    <input
                      type="number"
                      id="maxSession"
                      name="maxSession"
                      placeholder="Máximo"
                      value={maxSession}
                      onChange={(e) => setMaxSession(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="block text-lg font-semibold text-gray-700 dark:text-gray-100 mb-3 flex items-center">
                  <FaCalendarAlt className="mr-3 text-amber-500" />
                  Dias de Estudo
                </p>
                <div className="flex justify-around items-center pt-4">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      onClick={() => handleDaySelect(day)}
                      className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${studyDays.includes(day) ? 'bg-amber-500 text-white transform scale-110 shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}
                      title={day}
                    >
                      {day.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-amber-50 dark:bg-amber-900/50 rounded-lg border-2 border-amber-200 dark:border-amber-700">
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-4">Resumo do seu Planejamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-amber-900 dark:text-amber-100">
                <p><strong>Matérias:</strong> {selectedSubjectIds.length}</p>
                <p><strong>Horas/Semana:</strong> {studyHours}h</p>
                <p><strong>Meta de Questões:</strong> {weeklyQuestionsGoal}</p>
                <p><strong>Dias de Estudo:</strong> {studyDays.length}</p>
                <p><strong>Duração da Sessão:</strong> {minSession}-{maxSession} min</p>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(2)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={handleGenerateCycle} className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700">Gerar Ciclo</button>
            </div>
          </div>
        );
      case 4:
        const totalManualDuration = manualStudySessions.reduce((sum, session) => sum + session.duration, 0);
        const selectedManualSubject = subjectMap.get(newManualSessionSubjectId);

        return (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Criação Manual do Ciclo</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione sessões de estudo uma a uma para montar seu ciclo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="manualSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-100">Matéria</label>
                <div className="flex items-end gap-2">
                  <div className="relative w-full" ref={manualSubjectDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsManualSubjectDropdownOpen(!isManualSubjectDropdownOpen)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-left text-base border-2 border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                    >
                      <span className="block truncate text-gray-900">{selectedManualSubject?.subject || 'Selecione uma matéria'}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </button>
                    {isManualSubjectDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm dark:bg-gray-700 dark:ring-gray-600">
                        {subjects.map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setNewManualSessionSubjectId(s.id);
                              setIsManualSubjectDropdownOpen(false);
                            }}
                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-amber-100 dark:text-gray-100 dark:hover:bg-amber-800"
                          >
                            <span className="block whitespace-normal">{s.subject}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openTopicWeightsModal(newManualSessionSubjectId)}
                    disabled={!newManualSessionSubjectId}
                    className="p-3 h-full text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    title="Ajustar Relevância dos Tópicos"
                  >
                    <FaHandSparkles />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="manualDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-100">Duração (min)</label>
                <input
                  type="number"
                  id="manualDuration"
                  value={newManualSessionDuration}
                  onChange={(e) => setNewManualSessionDuration(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                  placeholder="Ex: 60"
                  min="1"
                />
              </div>
            </div>
            <button
              onClick={handleAddManualSession}
              className="w-full py-2 px-4 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors mb-6 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              Adicionar Sessão
            </button>

            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sessões Adicionadas ({manualStudySessions.length})</h3>
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
              {manualStudySessions.length > 0 ? (
                manualStudySessions.map((session, index) => (
                  <div key={session.id} className="flex justify-between items-stretch p-3 bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: session.color }}></span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{session.subject}</span>
                      <span className="ml-4 text-gray-700 dark:text-gray-100">{session.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleDuplicateManualSession(session)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <FaCopy />
                      </button>
                      <button onClick={() => handleRemoveManualSession(session.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 pt-8">
                  <p>Nenhuma sessão adicionada ainda.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <FaClock className="mr-3 text-amber-500 dark:text-amber-400" />
                  Horas Semanais
                </label>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{(totalManualDuration / 60).toFixed(1)}h</p>
              </div>
              <div>
                <label htmlFor="manualWeeklyQuestions" className="block text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <FaQuestionCircle className="mr-3 text-amber-500 dark:text-amber-400" />
                  Meta de Questões
                </label>
                <input
                  type="number"
                  id="manualWeeklyQuestions"
                  name="manualWeeklyQuestions"
                  value={weeklyQuestionsGoal}
                  onChange={(e) => setWeeklyQuestionsGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-amber-400"
                  placeholder="Ex: 250"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <FaCalendarAlt className="mr-3 text-amber-500 dark:text-amber-400" />
                Dias de Estudo
              </label>
              <div className="flex justify-around items-center pt-4">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${studyDays.includes(day) ? 'bg-amber-500 text-white transform scale-110 shadow-lg dark:bg-amber-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'}`}
                    title={day}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setModalStep(0)} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Voltar</button>
              <button onClick={handleSaveManualCycle} className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700">Salvar Ciclo</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl w-full mx-4 relative transform transition-all duration-300 ease-out scale-95 hover:scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10 dark:text-gray-400 dark:hover:text-gray-100">
          <FaTimes className="text-2xl" />
        </button>
        {renderModalContent()}
        
        {/* Renderiza o novo modal de pesos de tópicos */}
        <TopicWeightsModal
          isOpen={isTopicWeightsModalOpen}
          onClose={() => setIsTopicWeightsModalOpen(false)}
          subject={selectedSubjectForWeights}
        />
      </div>
    </div>
  );
};

const DonutChartForModal = ({ data, subjects }: { data: { [key: string]: string }, subjects: Subject[] }) => {
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const subjectColorMap = new Map(subjects.map(s => [s.id, s.color]));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 mx-auto">
      {Object.entries(data).map(([subjectId, percentage]) => {
        const color = subjectColorMap.get(subjectId) || '#94A3B8';
        const dash = (parseFloat(percentage) / 100) * circumference;
        const strokeDasharray = `${dash} ${circumference - dash}`;
        const strokeDashoffset = -offset;
        offset += dash;

        return (
          <circle
            key={subjectId}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </svg>
  );
};

export default CycleCreationModal;
