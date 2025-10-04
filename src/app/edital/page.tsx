'use client';

import React, { useState, Fragment } from 'react';
import { 
  BsCheckLg, BsXLg, BsPencilFill, BsPlusCircleFill, 
  BsChevronUp, BsChevronDown, BsFolder, BsPlus, BsPercent
} from 'react-icons/bs';
import { useData, StudyRecord, EditalSubject as Subject, EditalTopic as Topic } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import TopicRow from '../../components/TopicRow';

const SUBJECT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

const EditalPage = () => {
  const { 
    addStudyRecord, 
    updateStudyRecord, 
    studyRecords, 
    stats,
    loading
  } = useData();
  
  const { showNotification } = useNotification();
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [allTopicsExpanded, setAllTopicsExpanded] = useState(true); // Novo estado para controlar a expansão/colapso de todos os tópicos
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ subject: string; topic: Topic } | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);

  const handleSubjectClick = (index: number) => {
    setExpandedSubject(expandedSubject === index ? null : index);
  };

  const openRegisterModalForTopic = (subject: string, topic: Topic) => {
    setSelectedTopic({ subject, topic });
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const openRegisterModalForNew = () => {
    setSelectedTopic(null);
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setSelectedTopic(null);
    setEditingRecord(null);
    setIsRegisterModalOpen(false);
  };

  const handleSaveStudy = (record: StudyRecord) => {
    if (editingRecord) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }
    closeRegisterModal();
  };

  const handleToggleCompletion = async (subjectText: string, topicText: string) => {
    const recordToUpdate = studyRecords.find(
      record => record.subject === subjectText && record.topic === topicText
    );

    if (recordToUpdate) {
      const updatedRecord = { ...recordToUpdate, teoriaFinalizada: !recordToUpdate.teoriaFinalizada };
      await updateStudyRecord(updatedRecord);
    } else {
      const newRecord: Omit<StudyRecord, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        subject: subjectText,
        topic: topicText,
        studyTime: 0,
        questions: { correct: 0, total: 0 },
        pages: [],
        videos: [],
        notes: '',
        category: 'teoria',
        teoriaFinalizada: true,
        countInPlanning: false,
      };
      await addStudyRecord(newRecord);
    }
  };

  const { editalData, totalTopics, completedTopics, overallEditalProgress } = stats;

  if (loading) {
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center"><p className="dark:text-gray-100">Carregando edital...</p></div>;
  }

  const getPerformancePillColor = (p: number) => {
    if (p >= 80) return 'bg-green-100 text-green-700';
    if (p >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Helper recursivo para contar tópicos para a UI
  const countTopicsRecursively = (topics: Topic[]): { total: number, completed: number, totalQuestions: number, correctQuestions: number } => {
    let total = 0;
    let completed = 0;
    let totalQuestions = 0;
    let correctQuestions = 0;

    for (const topic of topics) {
      // Se o tópico não tem filhos, ele é uma "folha" e seus valores devem ser contados.
      if (!topic.sub_topics || topic.sub_topics.length === 0) {
        total++;
        if (topic.is_completed) completed++;
        totalQuestions += topic.total || 0;
        correctQuestions += topic.completed || 0;
      } else {
        // Se o tópico tem filhos, ele é um agrupador. Devemos contar apenas os filhos.
        const subCounts = countTopicsRecursively(topic.sub_topics);
        total += subCounts.total;
        completed += subCounts.completed;
        totalQuestions += subCounts.totalQuestions;
        correctQuestions += subCounts.correctQuestions;
      }
    }
    return { total, completed, totalQuestions, correctQuestions };
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
        <div className="mb-6">
          <header className="flex justify-between items-center pt-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Edital Verticalizado</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={openRegisterModalForNew} 
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

        <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <h2 className="text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase">PROGRESSO NO EDITAL</h2>
          <div className="flex justify-between items-end mb-2">
            <p className="text-gray-700 dark:text-gray-300 text-sm">{completedTopics} de {totalTopics} Tópicos concluídos</p>
            <p className="text-gray-700 dark:text-gray-300 font-bold text-3xl">{overallEditalProgress.toFixed(0)}%</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div className="bg-amber-500 h-4 rounded-full transition-all duration-300" style={{ width: `${overallEditalProgress}%` }}></div>
          </div>
        </div>

        <ul className="space-y-4">
          {editalData.map((subject, subjectIndex) => {
            const subjectColor = SUBJECT_COLORS[subjectIndex % SUBJECT_COLORS.length];
            const { total: totalSubjectTopics, completed: completedSubjectTopics, totalQuestions: totalSubjectQuestions, correctQuestions: totalSubjectCompleted } = countTopicsRecursively(subject.topics);
            const reviewed = totalSubjectQuestions - totalSubjectCompleted;
            const subjectCompletionPercentage = totalSubjectTopics > 0 ? Math.round((completedSubjectTopics / totalSubjectTopics) * 100) : 0;
            const subjectPerformance = totalSubjectQuestions > 0 ? Math.round((totalSubjectCompleted / totalSubjectQuestions) * 100) : 0;

            return (
              <li key={subjectIndex} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex flex-col">
                <div className="w-full flex items-center justify-between cursor-pointer" onClick={() => handleSubjectClick(subjectIndex)}>
                  <div className="flex items-center">
                    <div className={`w-2 h-6 rounded-l-lg ${subjectColor} mr-4`}></div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{subject.subject}</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    {expandedSubject !== subjectIndex && (
                      <>
                        <div className="flex items-center text-sm font-semibold">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-l-md" title="Acertos">{totalSubjectCompleted}</span>
                          <span className="bg-red-100 text-red-700 px-2 py-1" title="Erros">{reviewed}</span>
                          <span className="bg-gray-200 text-gray-800 dark:text-gray-100 px-2 py-1" title="Total de Questões">{totalSubjectQuestions}</span>
                          <span className={`${getPerformancePillColor(subjectPerformance)} px-2 py-1 rounded-r-md`} title="Percentual de Acerto">{subjectPerformance}%</span>
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className={`${subjectColor} h-2 rounded-full`} style={{ width: `${subjectCompletionPercentage}%` }}></div></div>
                        <span className="text-sm text-gray-600">{subjectCompletionPercentage}%</span>
                      </>
                    )}
                    <span className="text-xl">{expandedSubject === subjectIndex ? <BsChevronUp /> : <BsChevronDown />}</span>
                  </div>
                </div>

                {expandedSubject === subjectIndex && (
                  <div className="mt-4 w-full">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-900">
                            <th className="p-2 text-gray-800 dark:text-gray-100">
                              <button
                                onClick={() => setAllTopicsExpanded(prev => !prev)}
                                className="mr-2 text-gray-500 dark:text-gray-400 focus:outline-none"
                                title={allTopicsExpanded ? 'Minimizar Todos' : 'Maximizar Todos'}
                              >
                                {allTopicsExpanded ? <BsChevronUp /> : <BsChevronDown />}
                              </button>
                              Tópico
                            </th>
                            <th className="p-2 w-16 text-teal-500 dark:text-teal-400" title="Questões Corretas"><div className="flex justify-center"><BsCheckLg /></div></th>
                            <th className="p-2 w-16 text-red-500 dark:text-red-400" title="Questões Erradas"><div className="flex justify-center"><BsXLg /></div></th>
                            <th className="p-2 w-16 dark:text-gray-100" title="Total de Questões"><div className="flex justify-center text-gray-800 dark:text-gray-100"><BsPencilFill /></div></th>
                            <th className="p-2 w-20 dark:text-gray-100" title="Percentual de Acerto"><div className="flex justify-center text-gray-800 dark:text-gray-100"><BsPercent /></div></th>
                            <th className="p-2 w-32 text-center text-gray-800 dark:text-gray-100">Último Estudo</th>
                            <th className="p-2 w-16 text-center text-gray-800 dark:text-gray-100">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.topics.map((topic, topicIndex) => (
                            <TopicRow 
                              key={topicIndex} 
                              topic={topic} 
                              subjectName={subject.subject} 
                              level={0} 
                              onToggleCompletion={handleToggleCompletion}
                              onOpenRegisterModal={openRegisterModalForTopic}
                              allTopicsExpanded={allTopicsExpanded}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <StudyRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={closeRegisterModal}
          onSave={handleSaveStudy}
          initialRecord={editingRecord}
          topic={selectedTopic}
          initialTime={0} // Simplified, as savedStudyTime is not defined here
          showDeleteButton={!!editingRecord?.id}
        />
      </div>
    </>
  );
};

export default EditalPage;