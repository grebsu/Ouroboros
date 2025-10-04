'use client';

import React from 'react';
import { useData } from '../context/DataContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { FaCheckCircle } from 'react-icons/fa';

const StudySessionList: React.FC = () => {
  const { studyCycle, setStudyCycle, sessionProgressMap } = useData();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && studyCycle) {
      setStudyCycle((items) => {
        if (!items) return null;
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over!.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const pendingSessions = studyCycle?.filter(session => (sessionProgressMap[session.id] || 0) < session.duration) || [];
  const completedSessions = studyCycle?.filter(session => (sessionProgressMap[session.id] || 0) >= session.duration) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Sequência de Estudos</h3>
        {pendingSessions.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pendingSessions} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {pendingSessions.map((session, index) => (
                  <SortableItem
                    key={session.id}
                    session={session}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão pendente.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Estudos Concluídos</h3>
        {completedSessions.length > 0 ? (
          <div className="space-y-2">
            {completedSessions.map((session) => (
              <div key={session.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm flex items-center justify-between opacity-60">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: session.color }}></span>
                  <span className="font-semibold text-gray-500 dark:text-gray-400 line-through">{session.subject}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 dark:text-gray-500 mr-3">{session.duration} min</span>
                  <FaCheckCircle className="text-green-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão concluída ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySessionList;
