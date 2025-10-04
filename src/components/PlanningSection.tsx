'use client';

import React from 'react';
import { useData } from '../context/DataContext';
import Link from 'next/link'; // Importar Link

const PlanningSection = () => {
  const { studyCycle, sessionProgressMap } = useData();
  const DISPLAY_LIMIT = 5; // Limite de itens a serem exibidos

  const uncompletedSessions = studyCycle
    ? studyCycle.filter(session => {
        const progress = sessionProgressMap[session.id as string] || 0;
        return progress < session.duration;
      })
    : [];

  const displayedCycle = uncompletedSessions.slice(0, DISPLAY_LIMIT);
  const hasMore = uncompletedSessions.length > DISPLAY_LIMIT;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mt-6 dark:bg-gray-800 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">PLANEJAMENTO</h2>
      {studyCycle && studyCycle.length > 0 ? (
        <>
          <ul className="space-y-2">
            {displayedCycle.map((session, index) => (
              <li key={index} className="flex items-center p-2 rounded-md" style={{ backgroundColor: session.color }}>
                <span className="text-white font-semibold">{session.subject}</span>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-4 text-center">
              <Link href="/planejamento" className="text-gold-500 hover:text-gold-600 font-semibold">
                Ver Mais ({uncompletedSessions.length - DISPLAY_LIMIT} sessões restantes)
              </Link>
            </div>
          )}
          {uncompletedSessions.length === 0 && (
            <p className="text-gray-600 dark:text-gray-300">Todas as sessões do planejamento foram concluídas!</p>
          )}
        </>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">Nenhum ciclo de estudos ativo. Crie um na página de planejamento.</p>
      )}
    </div>
  );
};

export default PlanningSection;
