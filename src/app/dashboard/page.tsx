'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '../../context/DataContext';
import { getJsonContent } from '../actions';
import StudyRegisterModal, { StudyRecord } from '../../components/StudyRegisterModal';
import { BsPlusCircleFill } from 'react-icons/bs';
import WeeklyStudyChart from '../../components/WeeklyStudyChart';
import PlanSelector from '../../components/PlanSelector';
import RevisionsSection from '../../components/RevisionsSection';
import PlanningSection from '../../components/PlanningSection';
import DailyStudySection from '../../components/DailyStudySection';
import { FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaClock, FaCalendarDay, FaBullseye, FaFileAlt } from 'react-icons/fa';
import RemindersSection from '../../components/RemindersSection';
import LastActivitiesSection from '../../components/LastActivitiesSection';


// Interfaces para os dados
interface Topic {
  topic_text: string;
  is_completed: boolean;
  completed: number;
  reviewed: number;
}

interface Subject {
  subject: string;
  topics: Topic[];
  color: string;
}

interface EnrichedSubject extends Subject {
  totalStudyTimeSubject: number;
  totalCorrectQuestionsSubject: number;
  totalIncorrectQuestionsSubject: number;
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

// Função auxiliar para formatar horas e minutos
const formatHours = (ms: number) => {
  if (isNaN(ms) || ms < 0) return '0h00min';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, '0')}min`;
};

// Componente para o Rastreador de Constância
const StudyConsistencyTracker = ({ 
  consecutiveDays, 
  daysData = [], 
  startDate, 
  endDate, 
  onPrev, 
  onNext, 
  isPrevDisabled, 
  isNextDisabled 
}) => {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setDate(d.getDate() + 1); // Ajuste para exibição correta da data
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getTooltipText = (day) => {
    const date = new Date(day.date);
    date.setDate(date.getDate() + 1); // Ajuste para exibição correta da data
    const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    let statusText = 'Não estudado';
    if (day.status === 'studied') statusText = 'Estudado';
    if (day.status === 'rest') statusText = 'Dia de folga';

    return `${formattedDate}: ${statusText}`;
  };

  const getDayClass = (day) => {
    if (!day.active) return 'bg-gray-200';
    switch (day.status) {
      case 'studied':
        return 'bg-amber-500';
      case 'failed':
        return 'bg-red-200';
      case 'rest':
        return 'bg-yellow-100 relative';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">CONSTÂNCIA NOS ESTUDOS</h2>
          <p className="text-gray-600 dark:text-gray-300">Você está há <span className="font-bold text-amber-500">{consecutiveDays}</span> dias sem falhar!</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onPrev} disabled={false} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
            <FaChevronLeft className="text-gray-600" />
          </button>
          <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm w-28 text-center">{formatDate(startDate)} - {formatDate(endDate)}</span>
          <button onClick={onNext} disabled={false} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
            <FaChevronRight className="text-gray-600" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-15 gap-1.5">
        {daysData.map((day, index) => (
          <div key={index} className="relative group">
            <div
              className={`w-full h-4 rounded-sm ${getDayClass(day)}`}
            >
              {day.status === 'rest' && (
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-black rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              )}
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {getTooltipText(day)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para Metas Semanais
const WeeklyStudyGoals = ({ currentHours, goalHours, currentQuestions, goalQuestions }) => {
  const formatHoursDisplay = (ms) => {
    if (!ms || isNaN(ms) || ms <= 0) return 'N/A';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}min`;
  };

  // New function for hours bar color
  const getBarColorForHours = (percentage) => {
    if (percentage >= 100) return 'bg-amber-500';
    if (percentage > 80) return 'bg-amber-400';
    if (percentage > 40) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // New function for questions bar color
  const getBarColorForQuestions = (percentage) => {
    if (percentage >= 100) return 'bg-yellow-500';
    if (percentage > 80) return 'bg-yellow-400';
    if (percentage > 40) return 'bg-orange-300';
    return 'bg-red-500';
  };

  const hoursPercentage = goalHours > 0 ? (currentHours / goalHours) * 100 : 0;
  const questionsPercentage = goalQuestions > 0 ? (currentQuestions / goalQuestions) * 100 : 0;

  const hoursBarColor = getBarColorForHours(hoursPercentage); // Use new function
  const questionsBarColor = getBarColorForQuestions(questionsPercentage); // Use new function

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">METAS DE ESTUDO SEMANAL</h2>
      <div className="space-y-4">
        {/* Barra de Horas */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Horas de Estudo</span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{formatHours(currentHours)} / {formatHoursDisplay(goalHours)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div className={`${hoursBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(hoursPercentage, 100)}%` }}></div>
          </div>
          <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{hoursPercentage.toFixed(1)}%</p>
        </div>
        {/* Barra de Questões */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Questões</span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{currentQuestions} / {goalQuestions > 0 ? goalQuestions : 'N/A'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div className={`${questionsBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(questionsPercentage, 100)}%` }}></div>
          </div>
          <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{questionsPercentage.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { 
    selectedDataFile, 
    setSelectedDataFile, 
    availablePlans, 
    addStudyRecord, 
    stats,
    handleConsistencyNav,
    studyHours,
    weeklyQuestionsGoal
  } = useData();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleAddClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleSave = (record: StudyRecord) => {
    addStudyRecord(record);
    setIsRegisterModalOpen(false);
  };

  const overallPerformance = useMemo(() => {
    return stats.totalQuestions > 0 ? (stats.totalCorrectQuestions / stats.totalQuestions) * 100 : 0;
  }, [stats.totalCorrectQuestions, stats.totalQuestions]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAddClick} 
              className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
            >
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                <BsPlusCircleFill className="mr-2 text-lg" />
                Adicionar
              </span>
            </button>
            </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* Card: Tempo de Estudo */}
        <div className="relative bg-amber-500 shadow-lg rounded-xl p-6 flex items-center space-x-6 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden group">
          <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
          <div className="relative bg-white dark:bg-gray-700 p-4 rounded-full shadow-md dark:shadow-lg">
            <FaClock className="text-3xl text-amber-500" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Tempo de Estudo</h2>
            <p className="text-3xl font-bold text-white">{formatTime(stats.totalStudyTime)}</p>
          </div>
        </div>

        {/* Card: Média Diária */}
        <div className="relative bg-amber-500 shadow-lg rounded-xl p-6 flex items-center space-x-6 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden group">
          <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
          <div className="relative bg-white dark:bg-gray-700 p-4 rounded-full shadow-md dark:shadow-lg">
            <FaCalendarDay className="text-3xl text-amber-500" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Média Diária</h2>
            <p className="text-3xl font-bold text-white">{formatTime(stats.totalStudyTime / stats.uniqueStudyDays || 0)}</p>
          </div>
        </div>

        {/* Card: Desempenho */}
        <div className="relative bg-amber-500 shadow-lg rounded-xl p-6 flex items-center space-x-6 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden group">
          <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
          <div className="relative bg-white dark:bg-gray-700 p-4 rounded-full shadow-md dark:shadow-lg">
            <FaBullseye className="text-3xl text-amber-500" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Desempenho</h2>
            <p className="text-3xl font-bold text-white">{overallPerformance.toFixed(1)}%</p>
          </div>
        </div>

        {/* Card: Progresso no Edital */}
        <div className="relative bg-amber-500 shadow-lg rounded-xl p-6 flex items-center space-x-6 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden group">
          <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
          <div className="relative bg-white dark:bg-gray-700 p-4 rounded-full shadow-md dark:shadow-lg">
            <FaFileAlt className="text-3xl text-amber-500" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Progresso Edital</h2>
            <p className="text-3xl font-bold text-white">{stats.overallEditalProgress.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <StudyConsistencyTracker 
          consecutiveDays={stats.consecutiveDays} 
          daysData={stats.consistencyData}
          startDate={stats.consistencyStartDate}
          endDate={stats.consistencyEndDate}
          onPrev={() => handleConsistencyNav(-1)}
          onNext={() => handleConsistencyNav(1)}
          isPrevDisabled={stats.isConsistencyPrevDisabled}
          isNextDisabled={stats.isConsistencyNextDisabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full mt-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:col-span-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Painel de Desempenho</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 dark:text-amber-200 uppercase tracking-wider">Disciplina</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 dark:text-amber-200 uppercase tracking-wider">Tempo</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 dark:text-amber-200 uppercase tracking-wider">Questões</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 dark:text-amber-200 uppercase tracking-wider" style={{width: '25%'}}>Acerto %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(stats.subjectPerformance).map(([subjectName, subjectStats], index) => {
                  const performancePercentage = subjectStats.performance || 0;
                  
                  const getBarColor = (percentage) => {
                    if (percentage >= 85) return 'bg-green-500';
                    if (percentage >= 70) return 'bg-amber-500';
                    if (percentage >= 50) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };
                  const barColor = getBarColor(performancePercentage);

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{subjectName}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-300">{formatHours(subjectStats.totalStudyTime)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-green-600 font-semibold">{subjectStats.correctQuestions}</span>
                        <span className="text-gray-400 dark:text-gray-500 mx-1">/</span>
                        <span className="text-red-600 font-semibold">{subjectStats.incorrectQuestions}</span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
                            <div className={`${barColor} h-4 rounded-full`} style={{ width: `${performancePercentage}%` }}></div>
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{performancePercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:col-span-2">
          <WeeklyStudyGoals 
            currentHours={stats.weeklyHours}
            goalHours={parseInt(studyHours, 10) * 60 * 60 * 1000}
            currentQuestions={stats.weeklyQuestions}
            goalQuestions={parseInt(weeklyQuestionsGoal, 10)}
          />
          <WeeklyStudyChart dailyStudyHours={stats.dailyStudyHours} dailyQuestionStats={stats.dailyQuestionStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mt-6">
        <div className="flex flex-col gap-6 md:col-span-3">
          <RevisionsSection />
          <PlanningSection />
          <LastActivitiesSection />
        </div>
        <div className="flex flex-col gap-6 md:col-span-1">
          <DailyStudySection dailySubjectStudyTime={stats.dailySubjectStudyTime} subjectColors={stats.editalData} />
          <RemindersSection />
        </div>
      </div>

      

      <StudyRegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSave={handleSave} 
        showDeleteButton={false}
      />
    </div>
  );
}
