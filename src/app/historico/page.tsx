'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useData, StudyRecord } from '../../context/DataContext';
import { BsPlusCircleFill, BsFunnel, BsPencilSquare, BsTrash } from 'react-icons/bs';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import FilterModal from '../../components/FilterModal';
import PlanSelector from '../../components/PlanSelector';
import ConfirmationModal from '../../components/ConfirmationModal'; // Importando o novo modal

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  color: string;
}

// Helper para formatar o tempo de milissegundos para HH:MM:SS
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Mapa para exibir nomes de categorias mais amigáveis
const categoryDisplayMap: { [key: string]: string } = {
  teoria: 'Teoria',
  revisao: 'Revisão',
  questoes: 'Questões',
  leitura_lei: 'Leitura de Lei',
  jurisprudencia: 'Jurisprudência',
};

interface Filters {
  subject: string;
  category: string;
  startDate: string;
  endDate: string;
}

const HistoricoPage = () => {
  // Acessando dados e funções do context
  const {
    studyRecords,
    addStudyRecord,
    updateStudyRecord,
    deleteStudyRecord,
    availablePlans,
    selectedDataFile,
    setSelectedDataFile,
    studyPlans, // Adicionado para acessar as cores
    stats,
  } = useData();

  // Estado para controle dos modais
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Estado para o modal de confirmação
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null); // Estado para o ID do registro a ser excluído

  // Estado para os filtros
  const [filters, setFilters] = useState<Filters>({
    subject: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  // Cria um mapa de matérias para cores para fácil acesso
  const subjectColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    if (studyPlans) {
      studyPlans.forEach(plan => {
        if (plan.subjects) {
          plan.subjects.forEach(subject => {
            if (!colorMap.has(subject.subject)) {
              colorMap.set(subject.subject, subject.color || '#94A3B8'); // Cor padrão
            }
          });
        }
      });
    }
    return colorMap;
  }, [studyPlans]);

  const allStudyRecords = useMemo(() => {
    return studyRecords;
  }, [studyRecords]);

  // Aplica os filtros aos registros de estudo
  const filteredRecords = useMemo(() => {
    return allStudyRecords.filter(record => {
      const recordDate = new Date(record.date);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      if (filters.subject && record.subject !== filters.subject) return false;
      if (filters.category && record.category !== filters.category) return false;

      return true;
    });
  }, [studyRecords, filters]);

  // Agrupa os registros filtrados por data
  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, StudyRecord[]>);
  }, [filteredRecords]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedRecords).sort((a, b) => 
      new Date(b.split('/').reverse().join('-')).getTime() - 
      new Date(a.split('/').reverse().join('-')).getTime()
    ), [groupedRecords]);

  // Handlers para abrir modais
  const handleAddClick = () => {
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const handleEditClick = (record: StudyRecord) => {
    setEditingRecord(record);
    setIsRegisterModalOpen(true);
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // Confirma e executa a exclusão
  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteStudyRecord(recordToDelete);
      setRecordToDelete(null);
      setIsConfirmModalOpen(false); // Fecha o modal após a exclusão
    }
  };

  const handleSave = (record: StudyRecord) => {
    if (editingRecord) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }
    setIsRegisterModalOpen(false);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
  };
  
  const availableSubjects = useMemo(() => {
    if (stats && stats.editalData) {
      return stats.editalData.map(s => s.subject);
    }
    return [];
  }, [stats]);


  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pt-12">
        {/* Cabeçalho */}
        <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Histórico de Estudos</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddClick}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold"
            >
              <BsPlusCircleFill className="mr-2 text-lg" />
              Adicionar Estudo
            </button>
            
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold"
            >
              <BsFunnel className="mr-2" />
              Filtros
            </button>
          </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
      </div>

        {/* Conteúdo Principal */}
        <main>
          {sortedDates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                {Object.values(filters).some(v => v !== '') 
                  ? "Nenhum registro corresponde aos filtros aplicados."
                  : "Nenhum registro de estudo encontrado. Comece adicionando seu primeiro estudo!"}
              </p>
            </div>
          ) : (
            sortedDates.map(date => (
              <section key={date} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{date}</h2>
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Matéria / Tópico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tempo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Questões</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {groupedRecords[date].map((record, index) => (
                        <tr key={`${record.id}-${index}`}>
                          <td 
                            className="px-6 py-4"
                            style={{ borderLeft: `5px solid ${subjectColorMap.get(record.subject) || '#94A3B8'}` }}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{record.subject}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs whitespace-normal">{record.topic}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{formatTime(record.studyTime)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            <span className="text-green-600 font-semibold">{record.questions?.correct || 0}</span> / <span className="text-red-600 font-semibold">{(record.questions?.total || 0) - (record.questions?.correct || 0)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.category === 'teoria' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : record.category === 'revisao' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                              {categoryDisplayMap[record.category] || record.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-4">
                              <button onClick={() => handleEditClick(record)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Editar">
                                <BsPencilSquare size={18} />
                              </button>
                              <button onClick={() => handleDeleteClick(record.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Excluir">
                                <BsTrash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {/* Modais */}
      <StudyRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={handleSave}
        initialRecord={editingRecord}
        showDeleteButton={!!editingRecord?.id}
      />
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        availableSubjects={availableSubjects}
        availableCategories={Object.values(categoryDisplayMap)}
        initialFilters={filters}
        sessions={allStudyRecords}
        availableEditalData={stats.editalData}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
};

export default HistoricoPage;
