'use client';

import React, { useState } from 'react';
import { FaPlus, FaFileAlt } from 'react-icons/fa';
import PlanSelector from '../../components/PlanSelector';
import AddSimuladoModal from '../../components/AddSimuladoModal';
import SimuladoCard from '../../components/SimuladoCard';
import SimuladoLineChart from '../../components/SimuladoLineChart';
import { useData } from '../../context/DataContext';
import { SimuladoRecord } from '../../app/actions';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function SimuladosPage() {
  const { simuladoRecords, deleteSimuladoRecord } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSimulado, setEditingSimulado] = useState<SimuladoRecord | null>(null);
  const [chartType, setChartType] = useState('desempenho'); // 'desempenho' ou 'pontuacao'
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [simuladoToDelete, setSimuladoToDelete] = useState<SimuladoRecord | null>(null);

  const realizadosCount = simuladoRecords.length;
  const latestSimulado = simuladoRecords.length > 0 ? simuladoRecords[simuladoRecords.length - 1] : null;

  const acertos = latestSimulado ? latestSimulado.subjects.reduce((sum, s) => sum + s.correct, 0) : 0;
  const totalQuestionsLastSimulado = latestSimulado ? latestSimulado.subjects.reduce((sum, s) => sum + s.totalQuestions, 0) : 0;
  const erros = latestSimulado ? latestSimulado.subjects.reduce((sum, s) => sum + s.incorrect, 0) : 0;
  const brancos = latestSimulado ? totalQuestionsLastSimulado - acertos - erros : 0;
  const percentual = totalQuestionsLastSimulado > 0 ? Math.round((acertos / totalQuestionsLastSimulado) * 100) : 0;

  const formatDateForChartLabel = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para garantir interpretação UTC
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Processar dados para os gráficos
  const chartLabels = simuladoRecords.map(s => formatDateForChartLabel(s.date));
  const chartPerformanceData = simuladoRecords.map(s => {
    const totalQ = s.subjects.reduce((sum, sub) => sum + sub.totalQuestions, 0);
    const correctQ = s.subjects.reduce((sum, sub) => sum + sub.correct, 0);
    return totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
  });

  const chartScoreData = simuladoRecords.map(s => {
    let totalScore = 0;
    s.subjects.forEach(sub => {
      if (s.style === 'Certo/Errado') {
        totalScore += (sub.correct - sub.incorrect);
      } else {
        totalScore += (sub.correct * sub.weight);
      }
    });
    return totalScore;
  });

  const handleOpenModal = () => {
    setEditingSimulado(null);
    setIsModalOpen(true);
  };

  const handleEditSimulado = (simulado: SimuladoRecord) => {
    setEditingSimulado(simulado);
    setIsModalOpen(true);
  };

  const handleDeleteSimulado = (simulado: SimuladoRecord) => {
    setSimuladoToDelete(simulado);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (simuladoToDelete) {
      await deleteSimuladoRecord(simuladoToDelete.id);
      setSimuladoToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">Simulados</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={handleOpenModal}
                className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
              >
                <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
                <span className="relative flex items-center">
                  <FaPlus className="mr-2" />
                  Novo Simulado
                </span>
              </button>
              
            </div>
          </header>

          {/* Corpo Principal */}
          <main>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Coluna Esquerda: Simulados Realizados e Último Simulado */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                {/* Simulados Realizados */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                  <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Simulados Realizados</h2>
                  <p className="text-4xl font-bold text-amber-500">{realizadosCount}</p>
                </div>

                {/* Último Simulado */}
                {latestSimulado && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">Último Simulado</h2>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Acertos</p>
                        <p className="text-xl font-bold text-green-500">{acertos}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Brancos</p>
                        <p className="text-xl font-bold text-gray-400">{brancos}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Erros</p>
                        <p className="text-xl font-bold text-red-500">{erros}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full flex items-center justify-center w-20 h-20 mx-auto">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{percentual}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Seu Desempenho */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:col-span-4">
                <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-4">Seu Desempenho</h2>
                {/* Placeholder para o gráfico */}
                <div className="relative flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-500 dark:text-gray-400">
                  {simuladoRecords.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
                      <button
                        onClick={() => setChartType('desempenho')}
                        className={`relative overflow-hidden group px-4 py-2 rounded-lg text-sm font-medium ${chartType === 'desempenho' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'} transition-colors`}>
                        <span className={`absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out ${chartType === 'desempenho' ? 'group-hover:left-[100%]' : ''}`}></span>
                        <span className="relative">Desempenho</span>
                      </button>
                      <button
                        onClick={() => setChartType('pontuacao')}
                        className={`relative overflow-hidden group px-4 py-2 rounded-lg text-sm font-medium ${chartType === 'pontuacao' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'} transition-colors`}>
                        <span className={`absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out ${chartType === 'pontuacao' ? 'group-hover:left-[100%]' : ''}`}></span>
                        <span className="relative">Pontuação</span>
                      </button>
                    </div>
                  )}
                  {simuladoRecords.length > 0 ? (
                    <SimuladoLineChart 
                      labels={chartLabels} 
                      performanceData={chartPerformanceData} 
                      scoreData={chartScoreData} 
                      chartType={chartType} 
                    />
                  ) : (
                    <p>Registre simulados para ver seu desempenho aqui.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagem Central */}
            {realizadosCount > 0 ? (
              <div className="lg:col-span-1 flex flex-col gap-4">
                {simuladoRecords.map(simulado => (
                  <SimuladoCard 
                    key={simulado.id} 
                    simulado={simulado} 
                    onEdit={handleEditSimulado} 
                    onDelete={handleDeleteSimulado} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4">Você ainda não registrou nenhum simulado.</h3>
                <p className="text-gray-500 dark:text-gray-300 mb-6">Que tal começar agora para acompanhar seu progresso?</p>
                <button 
                  onClick={handleOpenModal}
                  className="bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-amber-600 transition-transform transform hover:scale-105 duration-300 flex items-center mx-auto"
                >
                  <FaPlus className="mr-2" />
                  Registrar Novo Simulado
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      <AddSimuladoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialSimulado={editingSimulado}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o simulado "${simuladoToDelete?.name}"? Esta ação é irreversível.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
}