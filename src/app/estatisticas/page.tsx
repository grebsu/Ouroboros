'use client';

import React from 'react';
import { useData } from '../../context/DataContext';
import { BsPlusCircleFill, BsFunnel, BsArrowUp, BsArrowDown, BsChevronDown, BsChevronRight } from 'react-icons/bs';
import ChartComponents from '../../components/ChartComponents';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import FilterModal from '../../components/FilterModal';
import PlanSelector from '../../components/PlanSelector';
import StopwatchModal from '../../components/StopwatchModal';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, BarElement, RadialLinearScale, TooltipItem } from 'chart.js';
import 'chartjs-adapter-date-fns';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { HierarchicalPerformanceNode, StudyRecord } from '../../context/DataContext'; // Import HierarchicalPerformanceNode

import CategoryHoursChart from '../../components/CategoryHoursChart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, BarElement, RadialLinearScale);

export default function Estatisticas() {
  const { selectedDataFile, setSelectedDataFile, availablePlans, stats, addStudyRecord, updateStudyRecord, applyFilters, availableSubjects, availableEditalData, availableCategories } = useData();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [chartJsLoaded, setChartJsLoaded] = React.useState(false);
  
  const [editingRecord, setEditingRecord] = React.useState<StudyRecord | null>(null);
  const [showStopwatchModal, setShowStopwatchModal] = React.useState(false);
  const [stopwatchTargetDuration, setStopwatchTargetDuration] = React.useState<number | undefined>(undefined);
  const [stopwatchModalSubject, setStopwatchModalSubject] = React.useState<string | undefined>(undefined);
  const [allTopicsExpanded, setAllTopicsExpanded] = React.useState(true);
  const [subjectSortOrder, setSubjectSortOrder] = React.useState('desc'); // 'desc', 'asc', 'alpha'

  const sortedSubjectHours = React.useMemo(() => {
    const entries = Object.entries(stats.subjectStudyHours ?? {});
    if (subjectSortOrder === 'desc') {
      entries.sort(([, a], [, b]) => b - a);
    } else if (subjectSortOrder === 'asc') {
      entries.sort(([, a], [, b]) => a - b);
    } else { // 'alpha'
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries;
  }, [stats.subjectStudyHours, subjectSortOrder]);

  const openStopwatchModal = () => {
    setStopwatchModalSubject(''); // Define um valor padrão
    setShowStopwatchModal(true);
  };
  const closeStopwatchModal = () => setShowStopwatchModal(false);

  const getLocalYYYYMMDD = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    import('chartjs-plugin-zoom').then((mod) => {
      ChartJS.register(mod.default);
      setChartJsLoaded(true);
    });
  }, []);

  const lineData = {
    labels: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    datasets: [
      {
        label: 'Acertos Diários',
        data: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyQuestionStats ?? {})[date].correct),
        fill: false,
        borderColor: 'rgb(245, 158, 11)',
        tension: 0.1,
      },
      {
        label: 'Erros Diários',
        data: Object.keys(stats.dailyQuestionStats ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyQuestionStats ?? {})[date].incorrect),
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4B5563', // Cor para ambos os modos (cinza médio-escuro)
        }
      },
      title: {
        display: false,
        text: 'Acertos e Erros Diários',
      },
      tooltip: {
        titleColor: '#4B5563', // Cor do título do tooltip
        bodyColor: '#4B5563', // Cor do corpo do tooltip
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const,
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: { day: 'dd/MM/yyyy' }
        },
        title: {
          display: true,
          text: 'Data',
          color: '#4B5563',
        },
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: '#D1D5DB',
        }
      },
      y: {
        title: {
          display: true,
          text: 'Quantidade de Questões',
          color: '#4B5563',
        },
        beginAtZero: true,
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: '#D1D5DB',
        }
      },
    },
  };

  const formatTime = (milliseconds: number) => {
    if (isNaN(milliseconds) || milliseconds < 0) {
      return '0h 0m';
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleAddStudyClick = () => {
    setIsModalOpen(true);
  };

  const handleSaveStudy = (record: StudyRecord) => {
    if (record.id) {
      updateStudyRecord(record); // Se tem ID, atualiza
    } else {
      addStudyRecord({ ...record, id: Date.now().toString() }); // Se não tem ID, adiciona com um novo ID
    }
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const getPerformancePillColor = (p: number) => {
    if (p >= 80) return 'bg-gradient-to-r from-amber-400 to-amber-200 text-amber-900 font-bold animate-pulse';
    if (p >= 60) return 'bg-yellow-200 text-yellow-800';
    return 'bg-red-200 text-red-800';
  };

  interface HierarchicalPerformanceRowProps {
    node: HierarchicalPerformanceNode;
    level: number;
    getPerformancePillColor: (p: number) => string;
    allTopicsExpanded: boolean;
  }

  const HierarchicalPerformanceRow: React.FC<HierarchicalPerformanceRowProps> = ({ node, level, getPerformancePillColor, allTopicsExpanded }) => {
    const [isExpanded, setIsExpanded] = React.useState(allTopicsExpanded);
    const hasChildren = node.children && node.children.length > 0;

    React.useEffect(() => {
        setIsExpanded(allTopicsExpanded);
    }, [allTopicsExpanded]);

    const indentation = level * 24;
    const isGrouping = node.is_grouping_topic;

    return (
      <>
        <tr className={isGrouping ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
          <td style={{ paddingLeft: `${indentation + 16}px` }} className="w-3/5 px-4 py-3 text-sm font-medium break-words border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {hasChildren && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2 text-gray-500 dark:text-gray-400 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  {isExpanded ? <BsChevronDown /> : <BsChevronRight />}
                </button>
              )}
              <span className={`${isGrouping ? 'font-bold' : ''} ${!hasChildren && 'ml-7'}`}>
                {isGrouping ? `* ${node.name}` : node.name}
              </span>
            </div>
          </td>
          <td className="w-1/10 px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.acertos}</td>
          <td className="w-1/10 px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.erros}</td>
          <td className="w-1/10 px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.total}</td>
          <td className="w-1/10 px-4 py-3 whitespace-nowrap text-sm text-center font-semibold">
            <span className={`px-2 py-1 text-xs rounded-full ${getPerformancePillColor(Math.round(node.percentualAcerto))}`}>
              {node.percentualAcerto.toFixed(1)}%
            </span>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children.map((child, index) => (
          <HierarchicalPerformanceRow
            key={child.id || index}
            node={child}
            level={level + 1}
            getPerformancePillColor={getPerformancePillColor}
            allTopicsExpanded={allTopicsExpanded}
          />
        ))}
      </>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      {/* Cabeçalho e Linha Divisória */}
      <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Estatísticas</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAddStudyClick} 
              className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
            >
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                <BsPlusCircleFill className="mr-2 text-lg" />
                Adicionar Estudo
              </span>
            </button>
            
            <button 
              onClick={() => setIsFilterModalOpen(true)} 
              className="relative flex items-center px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 text-base font-semibold overflow-hidden group"
            >
              <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
              <span className="relative flex items-center">
                <BsFunnel className="mr-2" />
                Filtros
              </span>
            </button>
          </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
      </div>

      {/* Conteúdo da Página */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1 */}
        <div className="col-span-1 flex flex-col min-h-[416px] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex-grow flex flex-col items-start">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4 text-left">Desempenho Geral</h2>
          <ChartComponents stats={stats} />
        </div>

        {/* Coluna 2 */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Tempo Total de Estudo</h2>
            <p className="text-3xl font-bold text-amber-500">{formatTime(stats.totalStudyTime)}</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{formatTime(stats.totalStudyTime / stats.uniqueStudyDays || 0)} por dia estudado (média)</p>
            <p className="text-gray-600 dark:text-gray-300">Total de {stats.uniqueStudyDays} dias estudados</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Páginas Lidas</h2>
              <p className="text-3xl font-bold text-amber-500">{stats.totalPagesRead}</p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.pagesPerHour.toFixed(1)} páginas/hora</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Tempo Total de Videoaulas</h2>
              <p className="text-3xl font-bold text-amber-500">{formatTime(stats.totalVideoTime)}</p>
            </div>
          </div>
        </div>

        {/* Coluna 3 */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Constância nos Estudos</h2>
            <p className="text-3xl font-bold text-amber-500">{stats.studyConsistencyPercentage.toFixed(1)}%</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.uniqueStudyDays} dias estudados de {stats.totalDaysSinceFirstRecord} dias</p>
            <p className="text-gray-600 dark:text-gray-300">({stats.failedStudyDays} dias falhados)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[200px] flex flex-col items-start">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2 text-left">Progresso no Edital</h2>
            <p className="text-3xl font-bold text-amber-500">{stats.overallEditalProgress.toFixed(1)}%</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.completedTopics} tópicos concluídos de {stats.totalTopics}</p>
            <p className="text-gray-600 dark:text-gray-300">({stats.pendingTopics} tópicos pendentes)</p>
          </div>
        </div>
      </div>

      {/* Nova Sessão Abaixo */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md col-span-full min-h-[500px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Evolução no Tempo</h2>
        <div className="h-full flex-grow">
          {chartJsLoaded && Object.keys(stats.dailyQuestionStats ?? {}).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhum registro de estudo diário.</p>
          ) : (
            chartJsLoaded && (
              <Line data={lineData} options={lineOptions} />
            )
          )}
        </div>
        
      </div>

      {/* Mais uma Nova Sessão Abaixo */}
      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md col-span-full min-h-[500px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">HORAS DE ESTUDO</h2>
        <div className="h-full flex-grow">
          {chartJsLoaded && Object.keys(stats.dailyStudyHours).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhum registro de horas de estudo diário.</p>
          ) : (
            chartJsLoaded && (
              <Bar
                data={{
                  labels: Object.keys(stats.dailyStudyHours ?? {}).sort((a, b) => {
                    return new Date(a).getTime() - new Date(b).getTime();
                  }).map(date => {
                    const [year, month, day] = date.split('-').map(Number);
                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                  }),
                  datasets: [{
                    label: 'Horas de Estudo',
                    data: Object.keys(stats.dailyStudyHours ?? {}).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => (stats.dailyStudyHours ?? {})[date]),
                    backgroundColor: 'rgb(245, 158, 11)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      title: { display: false },
                      ticks: { font: { size: 12 }, color: '#4B5563' },
                      grid: { color: '#D1D5DB' }
                    },
                    y: {
                      title: { display: false, text: 'Horas' },
                      min: 0,
                      max: 8,
                      ticks: { stepSize: 2, color: '#4B5563' },
                      grid: { color: '#D1D5DB' }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      titleColor: '#4B5563',
                      bodyColor: '#4B5563',
                    },
                    datalabels: {
                      anchor: 'end',
                      align: 'top',
                      color: 'rgb(245, 158, 11)',
                      font: { size: 12 },
                      formatter: (value: number) => value > 0 ? `${value.toFixed(1)}h` : ''
                    }
                  }
                }}
              />
            )
          )}
        </div>
      </div>

      {/* Duas Novas Sessões Lado a Lado */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">DISCIPLINAS x HORAS DE ESTUDO</h2>
            <div className="flex space-x-2">
              <button onClick={() => setSubjectSortOrder('desc')} className={`p-1 rounded-md ${subjectSortOrder === 'desc' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`} title="Ordenar descendente"><BsArrowDown /></button>
              <button onClick={() => setSubjectSortOrder('asc')} className={`p-1 rounded-md ${subjectSortOrder === 'asc' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`} title="Ordenar ascendente"><BsArrowUp /></button>
              <button onClick={() => setSubjectSortOrder('alpha')} className={`p-1 rounded-md ${subjectSortOrder === 'alpha' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`} title="Ordenar alfabeticamente">A-Z</button>
            </div>
          </div>
          <div className="h-full flex-grow relative">
            {chartJsLoaded && Object.keys(stats.subjectStudyHours).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de horas de estudo por disciplina.</p>
            ) : (
              chartJsLoaded && (
                <Bar
                  data={{
                    labels: sortedSubjectHours.map(([subject]) => subject),
                    datasets: [{
                      label: 'Horas de Estudo',
                      data: sortedSubjectHours.map(([, hours]) => hours),
                      backgroundColor: 'rgb(245, 158, 11)',
                      borderColor: 'rgb(245, 158, 11)',
                      borderWidth: 1,
                      barPercentage: 0.8,
                      categoryPercentage: 0.8
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: false },
                        min: 0,
                        ticks: { stepSize: 4, callback: (value: number) => `${value}h`, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      },
                      y: {
                        title: { display: false },
                        ticks: { font: { size: 12 }, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        enabled: true,
                        titleColor: '#4B5563',
                        bodyColor: '#4B5563',
                      },
                      datalabels: {
                        anchor: 'end',
                        align: 'right',
                        color: 'rgb(245, 158, 11)',
                        font: { size: 12 },
                        formatter: (value: number) => {
                          const hours = Math.floor(value);
                          const minutes = Math.round((value % 1) * 60);
                          return `${hours}h${minutes.toString().padStart(2, '0')}min`;
                        }
                      }
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[1000px] flex flex-col">
          <CategoryHoursChart categoryStudyHours={stats.categoryStudyHours} />
        </div>
      </div>

      {/* Duas Novas Sessões Empilhadas */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">DISCIPLINAS x DESEMPENHO</h2>
          <div className="h-full flex-grow relative">
            {chartJsLoaded && Object.keys(stats.subjectPerformance).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de desempenho por disciplina.</p>
            ) : (
              chartJsLoaded && (
                <Bar
                  data={{
                    labels: Object.keys(stats.subjectPerformance ?? {}).sort(),
                    datasets: [
                      {
                        label: 'Acertos',
                        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(subject => parseFloat(((stats.subjectPerformance ?? {})[subject]?.correctPercentage || 0).toFixed(1))),
                        backgroundColor: 'rgb(245, 158, 11)',
                      },
                      {
                        label: 'Erros',
                        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(subject => parseFloat(((stats.subjectPerformance ?? {})[subject]?.incorrectPercentage || 0).toFixed(1))),
                        backgroundColor: '#FF7043',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: false },
                        ticks: { font: { size: 12 }, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      },
                      y: {
                        title: { display: false },
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, callback: (value: number) => `${value}%`, color: '#4B5563' },
                        grid: { color: '#D1D5DB' }
                      }
                    },
                    plugins: {
                      legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, color: '#4B5563' } },
                      tooltip: {
                        enabled: true,
                        titleColor: '#4B5563',
                        bodyColor: '#4B5563',
                      },
                      datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: 'rgb(245, 158, 11)',
                        font: { size: 12 },
                        formatter: (value: number) => value > 0 ? `${value.toFixed(1)}%` : ''
                      }
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">TÓPICO X DESEMPENHO</h2>
          <div className="h-full flex-grow relative overflow-x-auto">
            {chartJsLoaded && Object.keys(stats.topicPerformance).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro de desempenho por tópico.</p>
            ) : (
              chartJsLoaded && (
                <table className="divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-amber-50 dark:bg-amber-900">
                    <tr>
                      <th scope="col" className="w-3/5 px-4 py-3 text-left text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider break-words border-r border-amber-200 dark:border-amber-700">
                        <button onClick={() => setAllTopicsExpanded(prev => !prev)} className="mr-2 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800">
                          {allTopicsExpanded ? <BsChevronDown /> : <BsChevronRight />}
                        </button>
                        Disciplina/Tópico
                      </th>
                      <th scope="col" className="w-1/10 px-4 py-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider break-words border-r border-amber-200 dark:border-amber-700">
                        Acertos
                      </th>
                      <th scope="col" className="w-1/10 px-4 py-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider break-words border-r border-amber-200 dark:border-amber-700">
                        Erros
                      </th>
                      <th scope="col" className="w-1/10 px-4 py-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider break-words border-r border-amber-200 dark:border-amber-700">
                        Total
                      </th>
                      <th scope="col" className="w-1/10 px-4 py-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider break-words">
                        Desempenho
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.topicPerformance.map((subjectNode, index) => (
                      <HierarchicalPerformanceRow
                        key={subjectNode.id || index}
                        node={subjectNode}
                        level={0}
                        getPerformancePillColor={getPerformancePillColor}
                        allTopicsExpanded={allTopicsExpanded}
                      />
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </div>
    <StudyRegisterModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSave={handleSaveStudy}
      initialRecord={editingRecord}
      showDeleteButton={!!editingRecord?.id}
    />
    <FilterModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      onApply={(filters) => {
        applyFilters(filters);
        setIsFilterModalOpen(false);
      }}
      sessions={stats.allRecords || []}
      availableSubjects={availableSubjects}
      availableEditalData={stats.editalData}
      availableCategories={availableCategories}
    />
    <StopwatchModal
      isOpen={showStopwatchModal}
      onClose={closeStopwatchModal}
      onSaveAndClose={(time, subject, topic) => {
        const subjectId = availableSubjects.find(s => s.subject === subject)?.id || '';
        const newRecord: StudyRecord = {
          id: '',
          date: getLocalYYYYMMDD(),
          studyTime: time,
          subject: subject || '',
          subjectId: subjectId,
          topic: topic || '',
          questions: { correct: 0, total: 0 },
          pages: [],
          videos: [],
          notes: 'Estudo cronometrado.',
          category: 'teoria',
          reviewPeriods: [],
          teoriaFinalizada: false,
          countInPlanning: false,
        };
        setEditingRecord(newRecord);
        setShowStopwatchModal(false);
        setIsModalOpen(true);
      }}
      targetDuration={stopwatchTargetDuration}
      subject={stopwatchModalSubject}
    />
    </>
  );
}
