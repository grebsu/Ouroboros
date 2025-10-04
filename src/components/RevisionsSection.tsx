'use client';

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

const RevisionsSection = () => {
  const { reviewRecords, updateReviewRecord } = useData();

  const todaysReviewRecords = useMemo(() => {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return reviewRecords
      .filter(record => {
        const [rYear, rMonth, rDay] = record.scheduledDate.split('-').map(Number);
        const recordDateUtc = new Date(Date.UTC(rYear, rMonth - 1, rDay));
        return recordDateUtc.getTime() <= todayUtc.getTime() && !record.completedDate && !record.ignored;
      })
      .sort((a, b) => {
        const [aYear, aMonth, aDay] = a.scheduledDate.split('-').map(Number);
        const dateA = new Date(Date.UTC(aYear, aMonth - 1, aDay));

        const [bYear, bMonth, bDay] = b.scheduledDate.split('-').map(Number);
        const dateB = new Date(Date.UTC(bYear, bMonth - 1, bDay));

        return dateA.getTime() - dateB.getTime();
      });
  }, [reviewRecords]);

  const handleCompleteReview = (id: string) => {
    const recordToUpdate = reviewRecords.find(record => record.id === id);
    if (recordToUpdate) {
      updateReviewRecord({ ...recordToUpdate, completedDate: new Date().toISOString().split('T')[0], ignored: false });
    }
  };

  const handleIgnoreReview = (id: string) => {
    const recordToUpdate = reviewRecords.find(record => record.id === id);
    if (recordToUpdate) {
      updateReviewRecord({ ...recordToUpdate, ignored: true, completedDate: undefined });
    }
  };
  
  const getDaysOverdue = (scheduledDate: string) => {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const [sYear, sMonth, sDay] = scheduledDate.split('-').map(Number);
    const scheduledDateUtc = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const diffTime = todayUtc.getTime() - scheduledDateUtc.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Próximas Revisões</h2>
      <div className="flex-grow overflow-y-auto -mr-3 pr-3">
        {todaysReviewRecords.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center mt-8">Nenhuma revisão pendente.</p>
        ) : (
          <div className="space-y-4">
            {todaysReviewRecords.map((record) => {
              const daysOverdue = getDaysOverdue(record.scheduledDate);
              const isOverdue = daysOverdue > 0;

              return (
                <div key={record.id} className="bg-gray-50 dark:bg-gray-700 border-l-4 border-gold-500 dark:border-gold-600 rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{record.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{record.topic}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCompleteReview(record.id)}
                        title="Marcar como concluída"
                        className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-700 dark:text-amber-300 transition-colors"
                      >
                        <BsCheckCircleFill />
                      </button>
                      <button
                        onClick={() => handleIgnoreReview(record.id)}
                        title="Ignorar por agora"
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 text-gray-600 dark:text-gray-200 transition-colors"
                      >
                        <BsXCircleFill />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      {isOverdue ? `Atrasada em ${daysOverdue} dia(s)` : 'Revisar hoje'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionsSection;
