'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData, StudyRecord, ReviewRecord } from '../../context/DataContext';
import { BsPlusCircleFill, BsPlayFill, BsCheckCircleFill, BsXCircleFill, BsClockFill, BsBookFill, BsCameraVideoFill, BsFileEarmarkTextFill, BsChatTextFill } from 'react-icons/bs';
import PlanSelector from '../../components/PlanSelector';
import StudyRegisterModal from '../../components/StudyRegisterModal';

// Category display map for FilterModal
const categoryDisplayMap: { [key: string]: string } = {
  teoria: 'Teoria',
  revisao: 'Revisão',
  questoes: 'Questões',
  leitura_lei: 'Leitura de Lei',
  jurisprudencia: 'Jurisprudência',
};

const categoryColorMap: { [key: string]: string } = {
  teoria: 'bg-blue-200 text-blue-800',
  revisao: 'bg-purple-200 text-purple-800',
  questoes: 'bg-green-200 text-green-800',
  leitura_lei: 'bg-yellow-200 text-yellow-800',
  jurisprudencia: 'bg-indigo-200 text-indigo-800',
};

const formatTime = (ms: number): string => {
  if (isNaN(ms) || ms < 0) {
    ms = 0;
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export default function Revisao() {
  const { selectedDataFile, setSelectedDataFile, availablePlans, addStudyRecord, updateStudyRecord, studyRecords, reviewRecords, updateReviewRecord } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'overdue' | 'ignored' | 'completed'>('scheduled');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [completingReviewId, setCompletingReviewId] = useState<string | null>(null);

  // Handle adding a new study record
  const handleAddClick = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Handle saving a study record
  const handleSave = (record: StudyRecord) => {
    if (editingRecord && editingRecord.id) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }

    if (completingReviewId) {
      const recordToUpdate = reviewRecords.find(r => r.id === completingReviewId);
      if (recordToUpdate) {
        updateReviewRecord({ ...recordToUpdate, completedDate: new Date().toISOString().split('T')[0], ignored: false });
      }
    }

    setIsModalOpen(false);
    setEditingRecord(null);
    setCompletingReviewId(null);
  };

  // This function will now open the modal to register the review as a study session
  const handleTriggerReviewAction = (reviewRecord: ReviewRecord) => {
    const originalStudyRecord = studyRecords.find(sr => sr.id === reviewRecord.studyRecordId);

    const prefilledStudyRecord: Partial<StudyRecord> = {
      subject: reviewRecord.subject,
      topic: reviewRecord.topic,
      category: 'revisao',
      material: originalStudyRecord?.material || '',
    };
    setEditingRecord(prefilledStudyRecord as StudyRecord);
    setCompletingReviewId(reviewRecord.id);
    setIsModalOpen(true);
  };

  // Handle ignoring a review
  const handleIgnoreReview = (id: string) => {
    const recordToUpdate = reviewRecords.find(record => record.id === id);
    if (recordToUpdate) {
      updateReviewRecord({ ...recordToUpdate, ignored: true, completedDate: undefined });
    }
  };

  // Filter review records based on active tab
  const filteredReviewRecords = useMemo(() => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // Normalize 'today' to UTC start of the day

    return reviewRecords.filter(record => {
      const [rYear, rMonth, rDay] = record.scheduledDate.split('-').map(Number);
      const recordDate = new Date(Date.UTC(rYear, rMonth - 1, rDay)); // Normalize 'recordDate' to UTC start of the day

      if (activeTab === 'scheduled') {
        return !record.completedDate && !record.ignored && recordDate >= today;
      } else if (activeTab === 'overdue') {
        return !record.completedDate && !record.ignored && recordDate < today;
      } else if (activeTab === 'ignored') {
        return record.ignored;
      } else if (activeTab === 'completed') {
        return !!record.completedDate;
      }
      return true;
    }).sort((a, b) => {
      // Ensure sorting also uses UTC dates for consistency
      const [aYear, aMonth, aDay] = a.scheduledDate.split('-').map(Number);
      const dateA = new Date(Date.UTC(aYear, aMonth - 1, aDay));

      const [bYear, bMonth, bDay] = b.scheduledDate.split('-').map(Number);
      const dateB = new Date(Date.UTC(bYear, bMonth - 1, bDay));

      if (activeTab === 'scheduled' || 'overdue') {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
  }, [reviewRecords, activeTab]);

  // Group filtered records by date
  const groupedReviewRecords = useMemo(() => {
    const groups: Record<string, ReviewRecord[]> = {};
    filteredReviewRecords.forEach(record => {
      const dateKey = record.scheduledDate;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  }, [filteredReviewRecords]);

  const getDaysRemainingText = (scheduledDateStr: string) => {
    const [sYear, sMonth, sDay] = scheduledDateStr.split('-').map(Number);
    const scheduledDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const diffTime = scheduledDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'HOJE';
    if (diffDays === 1) return 'AMANHÃ';
    if (diffDays > 1) return `${diffDays} DIAS`;
    return `${Math.abs(diffDays)} DIAS ATRASADOS`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12 font-sans">
      <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Revisões</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddClick}
              className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
            >
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                <BsPlusCircleFill className="mr-2 text-lg" />
                Adicionar Estudo
              </span>
            </button>
            
          </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
        </div>

      <div className="flex ml-6 mb-[-1px] z-10 relative">
          <div
            className={`px-4 py-2 mx-0.5 rounded-t-lg cursor-pointer font-semibold text-sm transition-all duration-300 border border-gray-300 dark:border-gray-600 border-b-0 ${activeTab === 'scheduled' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('scheduled')}
          >
            PROGRAMADAS
          </div>
          <div
            className={`px-4 py-2 mx-0.5 rounded-t-lg cursor-pointer font-semibold text-sm transition-all duration-300 border border-gray-300 dark:border-gray-600 border-b-0 ${activeTab === 'overdue' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('overdue')}
          >
            ATRASADAS
          </div>
          <div
            className={`px-4 py-2 mx-0.5 rounded-t-lg cursor-pointer font-semibold text-sm transition-all duration-300 border border-gray-300 dark:border-gray-600 border-b-0 ${activeTab === 'ignored' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('ignored')}
          >
            IGNORADAS
          </div>
          <div
            className={`px-4 py-2 mx-0.5 rounded-t-lg cursor-pointer font-semibold text-sm transition-all duration-300 border border-gray-300 dark:border-gray-600 border-b-0 ${activeTab === 'completed' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            CONCLUÍDAS
          </div>
        </div>

      <div className="revisoes-container container mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="space-y-6">
          {filteredReviewRecords.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {activeTab === 'scheduled' && 'Nenhuma revisão programada.'}
              {activeTab === 'overdue' && 'Nenhuma revisão atrasada.'}
              {activeTab === 'ignored' && 'Nenhuma revisão ignorada.'}
              {activeTab === 'completed' && 'Nenhuma revisão concluída.'}
            </p>
          ) : (
            Object.entries(groupedReviewRecords).map(([dateKey, recordsForDate]) => (
              <div key={dateKey} className="mb-8">
                <h2 className="flex items-center text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 pr-2">
                  {(() => {
                    const daysText = getDaysRemainingText(dateKey);
                    if (daysText === 'HOJE' || daysText === 'AMANHÃ' || daysText.includes('DIAS ATRASADOS')) {
                      return daysText;
                    }
                    const date = new Date(dateKey);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().substring(0, 3);
                    const year = date.getFullYear().toString().slice(-2);
                    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().substring(0, 3);

                    return (
                      <div className="flex items-center justify-start">
                        <span className="text-5xl font-extrabold mr-1">
                          {day}
                        </span>
                        <div className="flex flex-col items-start ml-1">
                          <span className="text-lg font-semibold">{`${month}/${year}`}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{weekday}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex-grow h-1 bg-amber-500 ml-4"></div>
                </h2>
                {recordsForDate.map((record) => {
                  const studyRecord = studyRecords.find(sr => sr.id === record.studyRecordId);
                  const scheduledDate = new Date(record.scheduledDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const diffTime = scheduledDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <React.Fragment key={record.id}>
                      <div className="flex items-start space-x-4">
                        {/* Coluna da Esquerda: Selo de Dias */}
                        <div>
                          <span className="bg-white dark:bg-gray-700 border border-amber-500 dark:border-amber-400 rounded-full px-3 py-1 text-base font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                            {diffDays === 0 ? 'HOJE' : `${diffDays} dia${diffDays !== 1 ? 's' : ''}`}
                          </span>
                        </div>

                        {/* Coluna da Direita: Conteúdo Principal */}
                        <div className="flex-1">
                          {/* Cabeçalho com Botões e Matéria */}
                          <div className="flex flex-wrap items-center justify-start space-x-4 mb-2">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleTriggerReviewAction(record)}
                                title="Iniciar Revisão"
                                className="flex items-center justify-center p-1 bg-amber-500 text-white rounded-full shadow-md hover:bg-amber-600 transition-colors"
                              >
                                <BsPlayFill className="text-sm" />
                              </button>
                              {activeTab !== 'completed' && (
                                <button
                                  onClick={() => handleTriggerReviewAction(record)}
                                  title="Concluir"
                                  className="flex items-center justify-center p-1 bg-amber-500 text-white rounded-full shadow-md hover:bg-amber-600 transition-colors"
                                >
                                  <BsPlusCircleFill className="text-sm text-white" />
                                </button>
                              )}
                              {activeTab !== 'ignored' && (
                                <button
                                  onClick={() => handleIgnoreReview(record.id)}
                                  title="Ignorar"
                                  className="flex items-center justify-center p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                  <BsXCircleFill className="text-sm text-white" />
                                </button>
                              )}
                            </div>
                            <span className="text-base font-semibold text-gray-800 dark:text-gray-100 uppercase">{record.subject}</span>
                          </div>
                          {/* Card Cinza Recuado */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm p-4">
                            <div className="flex justify-between items-center">
                              {/* Grupo 1: Identificação */}
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-bold">{new Date(record.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                <span>{record.topic}</span>
                                <span className={`px-2 py-1 rounded-full font-semibold ${studyRecord ? categoryColorMap[studyRecord.category] + ' dark:bg-opacity-20' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                                  {studyRecord?.category ? categoryDisplayMap[studyRecord.category] || studyRecord.category.toUpperCase() : 'N/A'}
                                </span>
                              </div>

                              {/* Grupo 2: Métricas */}
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                {studyRecord && studyRecord.studyTime > 0 && (
                                  <span className="flex items-center">
                                    <BsClockFill className="mr-1" /> {formatTime(studyRecord.studyTime)}
                                  </span>
                                )}
                                {studyRecord && (studyRecord.questions?.correct > 0 || studyRecord.questions?.total > 0) && (
                                  <>
                                    <span className="flex items-center text-green-600">
                                      <BsCheckCircleFill className="mr-1" /> {studyRecord.questions?.correct || 0}
                                    </span>
                                    <span className="flex items-center text-red-600">
                                      <BsXCircleFill className="mr-1" /> {(studyRecord.questions?.total || 0) - (studyRecord.questions?.correct || 0)}
                                    </span>
                                    <span className="font-semibold">
                                      {`${Math.round(((studyRecord.questions?.correct || 0) / (studyRecord.questions?.total || 0)) * 100)}%`}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Grupo 3: Materiais e Ação */}
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                {studyRecord && studyRecord.material && (
                                  <span className="flex items-center">
                                    <BsFileEarmarkTextFill className="mr-1" /> {studyRecord.material}
                                  </span>
                                )}
                                {studyRecord && studyRecord.pages && studyRecord.pages.length > 0 && (
                                  <span className="flex items-center">
                                    <BsBookFill className="mr-1" /> {studyRecord.pages.map(p => `${p.start}-${p.end}`).join(', ')}
                                  </span>
                                )}
                                {(() => {
                                  let totalVideoTimeForRecord = 0;
                                  if (studyRecord && studyRecord.videos) {
                                    studyRecord.videos.forEach(video => {
                                      const startParts = video.start.split(':').map(Number);
                                      const endParts = video.end.split(':').map(Number);
                                      const startTimeInMs = (startParts[0] * 3600 + startParts[1] * 60 + startParts[2]) * 1000;
                                      const endTimeInMs = (endParts[0] * 3600 + endParts[1] * 60 + endParts[2]) * 1000;
                                      totalVideoTimeForRecord += (endTimeInMs - startTimeInMs);
                                    });
                                  }
                                  if (totalVideoTimeForRecord > 0) {
                                    return (
                                      <span className="flex items-center">
                                        <BsCameraVideoFill className="mr-1" /> {formatTime(totalVideoTimeForRecord)}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="relative">
                                {studyRecord && studyRecord.comments && (
                                  <button
                                    onClick={() => setActiveCommentId(activeCommentId === record.id ? null : record.id)}
                                    title="Comentários"
                                    className="flex items-center justify-center p-3 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-colors"
                                  >
                                    <BsChatTextFill className="text-lg" />
                                  </button>
                                )}
                                {activeCommentId === record.id && (
                                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{studyRecord?.comments}</p>
                                    <div className="absolute bottom-0 right-4 w-4 h-4 bg-white dark:bg-gray-700 border-b border-r border-gray-300 dark:border-gray-600 rotate-45"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </React.Fragment>
                  );
                })}
              </div>
            ))
          )}
        </div>

        
      </div>

      <StudyRegisterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
          setCompletingReviewId(null);
        }}
        onSave={handleSave}
        initialRecord={editingRecord}
        showDeleteButton={!!editingRecord?.id}
      />
    </div>
  );
}