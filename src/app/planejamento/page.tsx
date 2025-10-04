'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, StudyRecord, StudySession } from '../../context/DataContext';
import { getJsonContent } from '../actions';
import Link from 'next/link';
import { useNotification } from '../../context/NotificationContext';
import { FaPlay, FaPlus, FaHandSparkles } from 'react-icons/fa';
import CycleCreationModal from '../../components/CycleCreationModal';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import StopwatchModal from '../../components/StopwatchModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';

// Interfaces
interface Subject {
  subject: string;
  topics: Topic[];
  color: string;
}

interface Topic {
  topic_text: string;
}

interface SubjectSettings {
  [key: string]: { importance: number; knowledge: number };
}

// Donut Chart Component
interface DonutChartProps {
  cycle: StudySession[];
  size?: number;
  remainingMinutes: number;
  hoveredSession: UniqueIdentifier | null;
  setHoveredSession: (id: UniqueIdentifier | null) => void;
  sessionProgressMap: { [key: string]: number };
  justCompletedId: string | null;
}

const DonutChart = ({ cycle, size = 300, remainingMinutes, hoveredSession, setHoveredSession, sessionProgressMap, justCompletedId }: DonutChartProps) => {
  const strokeWidth = 40;
  const gap = 5;

  const mainRingRadius = size / 2 - strokeWidth - gap;
  const progressRingRadius = size / 2 - (strokeWidth / 2);

  const mainCircumference = 2 * Math.PI * mainRingRadius;
  const progressCircumference = 2 * Math.PI * progressRingRadius;

  const formatMinutesToHoursMinutes = (minutes: number) => {
    if (minutes <= 0) return '0h00min';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h${String(m).padStart(2, '0')}min`;
  };

  const segments = useMemo(() => {
    if (!cycle || cycle.length === 0) return [];
    const totalSessions = cycle.length;
    if (totalSessions === 0) return [];

    const mainSegmentLength = mainCircumference / totalSessions;
    const progressSegmentLength = progressCircumference / totalSessions;
    let offset = 0;

    return cycle.map(session => {
      const progress = sessionProgressMap[session.id as string] || 0;
      const isCompleted = progress >= session.duration;
      const mainOffset = -offset * (mainCircumference / progressCircumference);
      const progressOffset = -offset;
      offset += progressSegmentLength;

      return {
        ...session,
        isCompleted,
        main: {
          key: `main-${session.id}`,
          strokeDasharray: `${mainSegmentLength} ${mainCircumference - mainSegmentLength}`,
          strokeDashoffset: mainOffset,
          color: isCompleted ? 'transparent' : session.color,
        },
        progress: {
          key: `progress-${session.id}`,
          strokeDasharray: `${progressSegmentLength} ${progressCircumference - progressSegmentLength}`,
          strokeDashoffset: progressOffset,
          color: isCompleted ? '#eab308' : 'transparent',
        },
      };
    });
  }, [cycle, mainCircumference, progressCircumference, sessionProgressMap]);

  const hoveredData = hoveredSession !== null ? cycle.find(s => s.id === hoveredSession) : null;

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={progressRingRadius} fill="transparent" strokeWidth={strokeWidth} className="stroke-gray-200 dark:stroke-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={mainRingRadius} fill="transparent" strokeWidth={strokeWidth} className="stroke-gray-200 dark:stroke-gray-700" />

        {segments.map(segment => (
          <circle
            key={segment.progress.key}
            cx={size / 2} cy={size / 2} r={progressRingRadius} fill="transparent"
            stroke={segment.progress.color} strokeWidth={strokeWidth}
            strokeDasharray={segment.progress.strokeDasharray} strokeDashoffset={segment.progress.strokeDashoffset}
            style={{
              transition: 'stroke 0.7s ease-in-out, stroke-opacity 0.7s ease-in-out, transform 0.3s ease-in-out',
              transform: justCompletedId === segment.id ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: 'center center',
            }}
          />
        ))}

        {segments.map((segment) => (
          <circle
            key={segment.main.key}
            cx={size / 2} cy={size / 2} r={mainRingRadius} fill="transparent"
            stroke={segment.main.color}
            strokeWidth={hoveredSession === segment.id && !segment.isCompleted ? strokeWidth + 10 : strokeWidth}
            strokeDasharray={segment.main.strokeDasharray} strokeDashoffset={segment.main.strokeDashoffset}
            onMouseEnter={() => !segment.isCompleted && setHoveredSession(segment.id)}
            onMouseLeave={() => setHoveredSession(null)}
            style={{ transition: 'stroke-width 0.2s, stroke 0.5s ease-in-out, stroke-opacity 0.5s ease-in-out' }}
          />
        ))}

        <circle cx={size / 2} cy={size / 2} r={mainRingRadius - (strokeWidth / 2)} className="fill-gray-200 dark:fill-gray-700" />

        <text
          x={size / 2} y={size / 2} dominantBaseline="middle" textAnchor="middle"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          fontSize="24" fontWeight="bold" style={{ pointerEvents: 'none' }}
          className="fill-gold-700 dark:fill-gold-200"
        >
          {formatMinutesToHoursMinutes(remainingMinutes)}
        </text>
      </svg>
      {hoveredData && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg pointer-events-none">
          <div className="flex items-center mb-2">
            <div style={{ width: '16px', height: '16px', backgroundColor: hoveredData.color, marginRight: '8px', borderRadius: '50%' }}></div>
            <p className="font-bold text-gray-800 dark:text-gray-100">{hoveredData.subject}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Duração: {hoveredData.duration} min</p>
        </div>
      )}
    </div>
  );
};

interface SortableItemProps {
    session: StudySession;
    hoveredSession: UniqueIdentifier | null;
    setHoveredSession: (id: UniqueIdentifier | null) => void;
    sessionProgressMap: { [key: string]: number };
    formatMinutesToHoursMinutes: (minutes: number) => string;
    setStopwatchTargetDuration: (duration: number | undefined) => void;
    setStopwatchModalSubject: (subject: string | undefined) => void;
    setCurrentStudySession: (session: StudySession | null) => void;
    setIsStopwatchModalOpen: (isOpen: boolean) => void;
    setInitialStudyRecord: (record: Partial<StudyRecord> | null) => void;
    setIsRegisterModalOpen: (isOpen: boolean) => void;
}

const SortableItem = ({
    session, hoveredSession, setHoveredSession, sessionProgressMap, formatMinutesToHoursMinutes,
    setStopwatchTargetDuration, setStopwatchModalSubject, setCurrentStudySession,
    setIsStopwatchModalOpen, setInitialStudyRecord, setIsRegisterModalOpen,
}: SortableItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: session.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const currentProgress = sessionProgressMap[session.id as string] || 0;
    const isCompleted = currentProgress >= session.duration;
    const progressPercentage = session.duration > 0 ? Math.min(100, (currentProgress / session.duration) * 100) : 0;

    return (
      <div
        ref={setNodeRef} style={style} {...attributes} {...listeners}
        className="rounded-md flex items-stretch transition-all duration-200 ease hover:shadow-lg hover:scale-[1.01] bg-gray-100 dark:bg-gray-700"
        onMouseEnter={() => setHoveredSession(session.id)}
        onMouseLeave={() => setHoveredSession(null)}
      >
        <div style={{ backgroundColor: session.color }} className="w-2 rounded-l-md"></div>
        <div className="p-3 flex-grow flex flex-col">
          <div className="flex justify-between items-center w-full mb-2">
            <span className="font-semibold text-gray-800 dark:text-gray-100">{session.subject}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              <span className="mr-1">🕒</span>{formatMinutesToHoursMinutes(currentProgress)}/{formatMinutesToHoursMinutes(session.duration)}
            </span>
          </div>
          <div className={`w-full bg-gray-200 dark:bg-gray-600 rounded-full ${hoveredSession === session.id ? 'h-3' : 'h-1'} transition-all duration-700 ease`}>
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          {hoveredSession === session.id && !isCompleted && (
            <div className="flex space-x-4 mt-2 w-full justify-start">
              <button
                onClick={() => {
                  setStopwatchTargetDuration(session.duration);
                  setStopwatchModalSubject(session.subject);
                  setCurrentStudySession(session);
                  setIsStopwatchModalOpen(true);
                }}
                className="flex items-center text-amber-500 hover:text-amber-700 hover:underline text-sm py-1 font-bold"
              >
                <FaPlay className="mr-2" />
                Iniciar Estudo
              </button>
              <button
                onClick={() => {
                  const prefilledRecord: Partial<StudyRecord> = {
                    subject: session.subject, topic: '', category: 'teoria',
                    countInPlanning: true, studyTime: session.duration * 60 * 1000,
                  };
                  setInitialStudyRecord(prefilledRecord);
                  setCurrentStudySession(session);
                  setIsRegisterModalOpen(true);
                }}
                className="text-amber-500 hover:text-amber-700 hover:underline text-sm py-1 font-bold flex items-center"
              >
                <FaPlus className="mr-2" />
                Registrar Estudo Manual
              </button>
            </div>
          )}
        </div>
      </div>
    );
};

export default function Planejamento() {
  const {
    selectedDataFile, addStudyRecord, updateStudyRecord, resetStudyCycle,
    studyCycle, setStudyCycle, completedCycles, currentProgressMinutes, sessionProgressMap, generateStudyCycle,
    setCurrentStudySession, initialStudyRecord, setInitialStudyRecord, stopwatchTargetDuration,
    setStopwatchTargetDuration, stopwatchModalSubject, setStopwatchModalSubject,
    handleCompleteSession, currentStudySession, studyHours, setStudyHours, weeklyQuestionsGoal, 
    setWeeklyQuestionsGoal, studyDays, setStudyDays, getRecommendedSession
  } = useData();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSettings, setSubjectSettings] = useState<SubjectSettings>({});
  
  const [minSession, setMinSession] = useState('60');
  const [maxSession, setMaxSession] = useState('120');
  
  const [recommendationJustification, setRecommendationJustification] = useState<string | null>(null);

  const [hoveredSession, setHoveredSession] = useState<UniqueIdentifier | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isClient, setIsClient] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      if (selectedDataFile) {
        const data: Subject[] | { subjects: Subject[] } = await getJsonContent(selectedDataFile);
        let subjectsArray: Subject[] = [];
        if (Array.isArray(data)) {
          subjectsArray = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.subjects)) {
          subjectsArray = data.subjects;
        }
        const subjectsWithColors = subjectsArray.map((s: Subject) => ({
          ...s,
          color: s.color || '#94A3B8'
        }));
        setSubjects(subjectsWithColors);
      } else {
        setSubjects([]); // Limpa as matérias se nenhum plano for selecionado
      }
    }
    
    loadSubjects();
    // Reinicia o estado local ao trocar de plano
    setSelectedSubjects([]);
    setSubjectSettings({});
    
  }, [selectedDataFile]);

  useEffect(() => {
    if (isModalOpen && selectedSubjects.length > 0) {
      setSubjectSettings(prevSettings => {
        const newSettings = { ...prevSettings };
        let changed = false;
        selectedSubjects.forEach(subject => {
          if (!newSettings[subject]) {
            newSettings[subject] = { importance: 3, knowledge: 3 };
            changed = true;
          }
        });
        Object.keys(newSettings).forEach(subject => {
            if (!selectedSubjects.includes(subject)) {
                delete newSettings[subject];
                changed = true;
            }
        });
        return changed ? newSettings : prevSettings;
      });
    }
  }, [selectedSubjects, isModalOpen]);

  const totalCycleDuration = useMemo(() => {
    if (!studyCycle) return 0;
    return studyCycle.reduce((sum, session) => sum + session.duration, 0);
  }, [studyCycle]);

  const totalProgressMinutes = useMemo(() => {
    if (!sessionProgressMap || Object.keys(sessionProgressMap).length === 0) return 0;
    return Object.values(sessionProgressMap).reduce((sum, progress) => sum + progress, 0);
  }, [sessionProgressMap]);

  const remainingMinutes = totalCycleDuration - totalProgressMinutes;

  const weeklyProgressPercent = parseInt(studyHours, 10) > 0 ? (currentProgressMinutes / (parseInt(studyHours, 10) * 60)) * 100 : 0;

  const cycleSize = 120;
  const cycleStrokeWidth = 12;
  const cycleRadius = (cycleSize - cycleStrokeWidth) / 2;
  const cycleCircumference = 2 * Math.PI * cycleRadius;
  const cycleProgressOffset = cycleCircumference - (weeklyProgressPercent / 100) * cycleCircumference;

  const formatMinutesToHoursMinutes = (minutes: number) => {
    if (minutes === 0) return '0min';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h${String(m).padStart(2, '0')}min`;
  };

  const generateCycle = () => {
    generateStudyCycle({
      studyHours: parseInt(studyHours, 10),
      minSession: parseInt(minSession, 10),
      maxSession: parseInt(maxSession, 10),
      subjectSettings,
      subjects: subjects.filter(s => selectedSubjects.includes(s.subject)),
      weeklyQuestionsGoal,
    });
    setIsModalOpen(false);
    showNotification('Ciclo de estudos gerado com sucesso!', 'success');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && studyCycle) {
      const oldIndex = studyCycle.findIndex((item) => item.id === active.id);
      const newIndex = studyCycle.findIndex((item) => item.id === over!.id);
      
      if (oldIndex > -1 && newIndex > -1) {
        const newOrder = arrayMove(studyCycle, oldIndex, newIndex);
        setStudyCycle(newOrder);
      }
    }
  };

  const handleSaveRecord = useCallback(async (record: StudyRecord) => {
    try {
      if (record.id && initialStudyRecord?.id === record.id) {
          await updateStudyRecord(record);
      } else {
          await addStudyRecord(record);
      }

      if (record.countInPlanning && currentStudySession) {
          const durationInMinutes = record.studyTime / (60 * 1000);
          handleCompleteSession(currentStudySession, durationInMinutes);
      }

      setIsRegisterModalOpen(false);
      setInitialStudyRecord(null);
      setCurrentStudySession(null);
      setRecommendationJustification(null);
      showNotification("Estudo registrado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao salvar registro de estudo:", error);
      showNotification("Erro ao salvar registro de estudo. Tente novamente.", "error");
    }
  }, [initialStudyRecord, updateStudyRecord, addStudyRecord, currentStudySession, handleCompleteSession, showNotification]);

  const handleGetRecommendation = () => {
    if (!studyCycle) {
      showNotification("Nenhum ciclo de estudos ativo.", "warning");
      return;
    }

    const nextSession = studyCycle.find(session => {
      const progress = sessionProgressMap[session.id as string] || 0;
      return progress < session.duration;
    });

    if (nextSession) {
      const { recommendedTopic, justification } = getRecommendedSession({ forceSubject: nextSession.subject });

      const prefilledRecord: Partial<StudyRecord> = {
        subject: nextSession.subject,
        topic: recommendedTopic ? recommendedTopic.topic : '',
        category: 'teoria', 
        countInPlanning: true,
        studyTime: nextSession.duration * 60 * 1000,
      };

      setInitialStudyRecord(prefilledRecord);
      setCurrentStudySession(nextSession);
      setRecommendationJustification(justification || `Seguindo a ordem do seu ciclo de estudos.`);
      setIsRegisterModalOpen(true);
    } else {
      showNotification("Parabéns! Você concluiu todas as sessões deste ciclo.", "success");
    }
  };

  if (!isClient) {
    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-12 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">Carregando Planejamento...</h1>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      <header className="flex justify-between items-center pt-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Planejamento</h1>
        {studyCycle && (
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleGetRecommendation}
              className="relative flex items-center px-4 py-2 bg-gold-600 text-white rounded-lg shadow-lg hover:bg-gold-700 transition-all duration-300 text-base font-semibold overflow-hidden group"
            >
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                <FaHandSparkles className="mr-2" />
                Iniciar Próximo Estudo
              </span>
            </button>
            <button onClick={() => {
              const allSubjectsInCycle = studyCycle.map(s => s.subject);
              const uniqueSubjects = [...new Set(allSubjectsInCycle)];
              setSelectedSubjects(uniqueSubjects);
              setIsModalOpen(true)
            }} className="relative flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg shadow-lg hover:bg-gold-600 transition-all duration-300 text-base font-semibold overflow-hidden group">
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                Editar
              </span>
            </button>
            <button onClick={resetStudyCycle} className="relative flex items-center px-4 py-2 bg-gold-500 text-white rounded-lg shadow-lg hover:bg-gold-600 transition-all duration-300 text-base font-semibold overflow-hidden group">
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                Remover
              </span>
            </button>
          </div>
        )}
      </header>
      <hr className="mb-6 border-gray-300 dark:border-gray-700" />

      {studyCycle ? (
        <div className="w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Ciclos Completos</h2>
              <div className="relative" style={{ width: cycleSize, height: cycleSize }}>
                <svg className="transform -rotate-90" width={cycleSize} height={cycleSize} viewBox={`0 0 ${cycleSize} ${cycleSize}`}>
                  <defs>
                    <linearGradient id="cycleProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <circle
                    className="text-gray-200 dark:text-gray-700" stroke="currentColor" strokeWidth={cycleStrokeWidth}
                    fill="transparent" r={cycleRadius} cx={cycleSize / 2} cy={cycleSize / 2}
                  />
                  <circle
                    stroke="url(#cycleProgressGradient)" strokeWidth={cycleStrokeWidth} strokeLinecap="round"
                    fill="transparent" r={cycleRadius} cx={cycleSize / 2} cy={cycleSize / 2}
                    style={{
                      strokeDasharray: cycleCircumference,
                      strokeDashoffset: cycleProgressOffset,
                      transition: 'stroke-dashoffset 0.5s ease-in-out'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gold-600 dark:text-gold-400">{completedCycles}</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-2">Progresso da Semana</h2>
              <p className="text-left text-gray-600 dark:text-gray-300 mb-2">{formatMinutesToHoursMinutes(currentProgressMinutes)} / {studyHours}h</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div className="bg-gradient-to-r from-gold-400 to-orange-500 h-6 rounded-full" style={{ width: `${weeklyProgressPercent}%`, transition: 'width 0.5s ease-in-out' }}></div>
              </div>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col md:row-span-2 h-full">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100 mb-4">Ciclo Atual</h2>
              <div className="flex-grow flex items-center justify-center">
                <DonutChart cycle={studyCycle} size={300} remainingMinutes={remainingMinutes} hoveredSession={hoveredSession} setHoveredSession={setHoveredSession} sessionProgressMap={sessionProgressMap} justCompletedId={justCompletedId} />
              </div>
            </div>
            <div className="md:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => setActiveTab('pending')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'pending' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Sequência de Estudos</button>
                <button onClick={() => setActiveTab('completed')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'completed' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Estudos Concluídos</button>
              </div>
              <div className="space-y-4 h-96 overflow-y-auto pr-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={studyCycle} strategy={verticalListSortingStrategy}>
                    {activeTab === 'pending' && studyCycle.filter(s => (sessionProgressMap[s.id as string] || 0) < s.duration).length > 0 ? (
                        studyCycle.filter(s => (sessionProgressMap[s.id as string] || 0) < s.duration).map((session) => (
                            <SortableItem
                              key={session.id}
                              session={session}
                              hoveredSession={hoveredSession}
                              setHoveredSession={setHoveredSession}
                              sessionProgressMap={sessionProgressMap}
                              formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                              setStopwatchTargetDuration={setStopwatchTargetDuration}
                              setStopwatchModalSubject={setStopwatchModalSubject}
                              setCurrentStudySession={setCurrentStudySession}
                              setIsStopwatchModalOpen={setIsStopwatchModalOpen}
                              setInitialStudyRecord={setInitialStudyRecord}
                              setIsRegisterModalOpen={setIsRegisterModalOpen}
                            />
                        ))
                    ) : activeTab === 'pending' ? (
                      <p className="text-gray-500 text-center mt-8">Todas as sessões foram concluídas. Bom trabalho!</p>
                    ) : null}

                    {activeTab === 'completed' && studyCycle.filter(s => (sessionProgressMap[s.id as string] || 0) >= s.duration).length > 0 ? (
                        studyCycle.filter(s => (sessionProgressMap[s.id as string] || 0) >= s.duration).map((session) => (
                            <SortableItem
                              key={session.id}
                              session={session}
                              hoveredSession={hoveredSession}
                              setHoveredSession={setHoveredSession}
                              sessionProgressMap={sessionProgressMap}
                              formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                              setStopwatchTargetDuration={setStopwatchTargetDuration}
                              setStopwatchModalSubject={setStopwatchModalSubject}
                              setCurrentStudySession={setCurrentStudySession}
                              setIsStopwatchModalOpen={setIsStopwatchModalOpen}
                              setInitialStudyRecord={setInitialStudyRecord}
                              setIsRegisterModalOpen={setIsRegisterModalOpen}
                            />
                        ))
                    ) : activeTab === 'completed' ? (
                      <p className="text-gray-500 text-center mt-8">Nenhuma sessão de estudo concluída ainda.</p>
                    ) : null}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Bem-vindo ao Planejamento!</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">Crie e gerencie seus ciclos de estudos personalizados. Comece definindo suas matérias, horários e metas.</p>
          <button onClick={() => { setIsModalOpen(true); }} className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-6 rounded-full shadow-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105">Começar Novo Ciclo de Estudos</button>
          {subjects.length === 0 && (
            <div className="mt-8 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg max-w-xl">
              <p className="font-semibold mb-2">Atenção:</p>
              <p>Nenhum plano de estudos encontrado. Para criar um ciclo, você precisa ter matérias cadastradas.</p>
              <p className="mt-2">Por favor, <Link href="/planos" className="underline font-bold text-red-800 dark:text-red-200 hover:text-red-900">crie ou selecione um plano</Link> para começar.</p>
            </div>
          )}
        </div>
      )}

      <StudyRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => {
              setIsRegisterModalOpen(false);
              setInitialStudyRecord(null);
              setCurrentStudySession(null);
              setRecommendationJustification(null);
          }}
          onSave={handleSaveRecord}
          initialRecord={initialStudyRecord}
          justification={recommendationJustification}
          showDeleteButton={!!initialStudyRecord?.id}
      />
      <StopwatchModal
          isOpen={isStopwatchModalOpen}
          onClose={() => setIsStopwatchModalOpen(false)}
          onSaveAndClose={async (time, subject, topic) => {
              try {
                const newRecord: Partial<StudyRecord> = {
                    date: new Date().toISOString().split('T')[0],
                    subject: subject || '',
                    topic: topic || '',
                    studyTime: time,
                    questions: { correct: 0, total: 0 },
                    material: '',
                    category: 'teoria',
                    notes: 'Estudo cronometrado.',
                    reviewPeriods: ['1d', '7d', '30d'],
                    teoriaFinalizada: false,
                    countInPlanning: true,
                    pages: [],
                    videos: [],
                };

                setInitialStudyRecord(newRecord);
                setIsRegisterModalOpen(true);
                setIsStopwatchModalOpen(false);
              } catch (error) {
                console.error("Erro ao preparar registro de estudo:", error);
                showNotification("Erro ao preparar registro de estudo. Tente novamente.", "error");
              }
          }}
          targetDuration={stopwatchTargetDuration}
          subject={stopwatchModalSubject}
      />

      <CycleCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={!!studyCycle}
        initialData={studyCycle ? {
          studyHours,
          weeklyQuestionsGoal,
          subjectSettings,
          selectedSubjects,
          minSession,
          maxSession,
          studyDays,
        } : undefined}
      />
    </div>
  );
}