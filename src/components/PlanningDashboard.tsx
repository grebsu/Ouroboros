'use client';

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { useSidebar } from '../context/SidebarContext';
import DonutChart from './DonutChart';
import StudySessionList from './StudySessionList';
import AddSessionModal from './AddSessionModal'; // Import the new modal

interface PlanningDashboardProps {
  onOpenModal: () => void;
}

const PlanningDashboard: React.FC<PlanningDashboardProps> = ({ onOpenModal }) => {
  const { studyCycle, selectedDataFile, setSelectedDataFile, setStudyCycle, stats, completedCycles, currentProgressMinutes, sessionProgressMap } = useData();
  const { showNotification } = useNotification();
  const { isSidebarOpen } = useSidebar();

  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  const handleEditCycle = () => {
    onOpenModal();
  };

  const totalCycleDuration = studyCycle?.reduce((sum, session) => sum + session.duration, 0) || 1;
  const weeklyProgressPercent = stats.weeklyHours > 0 ? (currentProgressMinutes / (stats.weeklyHours * 60)) * 100 : 0;

  const handleResetCycle = () => {
    if (window.confirm('Tem certeza que deseja remover o ciclo de estudos atual?')) {
      setStudyCycle(null);
    }
  };

  return (
    <div className="w-full mx-auto">
      <header className="flex justify-between items-center pt-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Planejamento</h1>
        {studyCycle && (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleEditCycle}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Editar
            </button>
            <button
              onClick={handleResetCycle}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Remover
            </button>
          </div>
        )}
      </header>
      <hr className="mb-6 border-gray-300" />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-base font-bold text-gray-700 mb-2">Ciclos Completos</h2>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="4" />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray={`${weeklyProgressPercent}, 100`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{completedCycles}</span>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Progresso</h2>
          <p className="text-left text-gray-600 mb-2">{currentProgressMinutes} / {stats.weeklyHours}h</p>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div className="bg-blue-600 h-6 rounded-full" style={{ width: `${weeklyProgressPercent}%` }}></div>
          </div>
        </div>
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md flex flex-col md:row-span-2 h-full">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Ciclo</h2>
          <div className="flex-grow flex items-center justify-center">
            <DonutChart 
              cycle={studyCycle || []} 
              size={300} 
              studyHours={stats.weeklyHours}
              hoveredSession={hoveredSession}
              setHoveredSession={setHoveredSession}
              sessionProgressMap={sessionProgressMap}
            />
          </div>
        </div>
        <div className="md:col-span-4 bg-white p-6 rounded-lg shadow-md">
          <StudySessionList />
        </div>
      </div>
    </div>
  );
};

export default PlanningDashboard;
