'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '../context/DataContext';
import { FaPlay, FaPlus } from 'react-icons/fa';

interface SortableItemProps {
  session: any;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ session, index }) => {
  const { 
    sessionProgressMap, 
    formatMinutesToHoursMinutes, 
    setStopwatchTargetDuration, 
    setStopwatchModalSubject, 
    setCurrentStudySession, 
    setIsStopwatchModalOpen,
    setInitialStudyRecord,
    setIsRegisterModalOpen,
  } = useData();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentProgress = sessionProgressMap[session.id as string] || 0;
  const progressPercentage = (currentProgress / session.duration) * 100;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-md flex items-stretch transition-all duration-200 ease hover:shadow-lg hover:scale-[1.01] bg-gray-100"
    >
      <div style={{ backgroundColor: session.color }} className="w-2 rounded-l-md"></div>
      <div className="p-3 flex-grow flex flex-col">
        <div className="flex justify-between items-center w-full mb-2">
          <span className={`font-semibold`}>
            {session.subject}
          </span>
          <span className={`text-sm text-gray-600`}>
            <span className="mr-1"></span>{formatMinutesToHoursMinutes(currentProgress)}/{formatMinutesToHoursMinutes(session.duration)}
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full h-1 transition-all duration-700 ease`}>
          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="flex space-x-4 mt-2 w-full justify-start">
            <button
              onClick={() => {
                setStopwatchTargetDuration(session.duration);
                setStopwatchModalSubject(session.subject);
                setCurrentStudySession(session);
                setIsStopwatchModalOpen(true);
              }}
              className="flex items-center text-teal-500 hover:text-teal-700 hover:underline text-sm py-1 font-bold"
            >
              <FaPlay className="mr-2" />
              Iniciar Estudo
            </button>
            <button
              onClick={() => {
                const newRecord = {
                  id: Date.now().toString(),
                  date: new Date().toISOString().split('T')[0],
                  subject: session.subject || '',
                  studyTime: session.duration * 60 * 1000,
                  topic: '',
                  correctQuestions: 0,
                  incorrectQuestions: 0,
                  material: '',
                  category: 'teoria',
                  comments: '',
                  reviewPeriods: ['1d', '7d', '30d'],
                  teoriaFinalizada: false,
                  countInPlanning: true,
                  pages: [],
                  videos: [],
                };
                setInitialStudyRecord(newRecord);
                setCurrentStudySession(session);
                setIsRegisterModalOpen(true);
              }}
              className="text-teal-500 hover:text-teal-700 hover:underline text-sm py-1 font-bold flex items-center"
            >
              <FaPlus className="mr-2" />
              Registrar Estudo Manual
            </button>
          </div>
      </div>
    </div>
  );
};

export default SortableItem;
