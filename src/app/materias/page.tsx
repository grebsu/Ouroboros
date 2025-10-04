'use client';

import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { FaBookOpen, FaQuestionCircle, FaChartLine, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Função auxiliar para formatar o tempo
const formatTime = (milliseconds: number) => {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return '0h 0m';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function MateriasPage() {
  const { studyPlans, studyRecords, loading } = useData();
  const router = useRouter();
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  const allSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { color: string; plans: string[] }>();

    if (!studyPlans) {
      return [];
    }

    studyPlans.forEach(plan => {
      if (plan.subjects) {
        plan.subjects.forEach(subject => {
          if (!subjectsMap.has(subject.subject)) {
            subjectsMap.set(subject.subject, { color: subject.color || '#94A3B8', plans: [] });
          }
          subjectsMap.get(subject.subject)!.plans.push(plan.name);
        });
      }
    });

    return Array.from(subjectsMap.entries()).map(([name, data]) => ({ name, ...data }));
  }, [studyPlans]);

  const subjectStats = useMemo(() => {
    const stats: { [key: string]: { totalStudyTime: number; totalQuestions: number; performance: number } } = {};

    allSubjects.forEach(subject => {
      const records = studyRecords.filter(r => r.subject === subject.name);
      const totalStudyTime = records.reduce((acc, r) => acc + (r.studyTime || 0), 0);
      const correct = records.reduce((acc, r) => acc + (r.questions?.correct || 0), 0);
      const incorrect = records.reduce((acc, r) => acc + ((r.questions?.total || 0) - (r.questions?.correct || 0)), 0);
      const totalQuestions = correct + incorrect;
      const performance = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
      stats[subject.name] = { totalStudyTime, totalQuestions, performance };
    });

    return stats;
  }, [allSubjects, studyRecords]);

  const overallStats = useMemo(() => {
    const totalStudyTime = Object.values(subjectStats).reduce((acc, stat) => acc + stat.totalStudyTime, 0);
    const totalQuestions = Object.values(subjectStats).reduce((acc, stat) => acc + stat.totalQuestions, 0);
    const weightedPerformanceSum = Object.values(subjectStats).reduce((acc, stat) => acc + (stat.performance * stat.totalQuestions), 0);
    const overallPerformance = totalQuestions > 0 ? Math.round(weightedPerformanceSum / totalQuestions) : 0;
    return { totalStudyTime, totalQuestions, overallPerformance };
  }, [subjectStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-100">Carregando dados das matérias...</p>
      </div>
    );
  }

  if (allSubjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Nenhuma Matéria Encontrada</h2>
          <p className="text-gray-600 dark:text-gray-300">Parece que você ainda não cadastrou nenhuma matéria nos seus planos de estudo.</p>
          <p className="text-gray-600 dark:text-gray-300">Vá para a página de <a href="/planos" className="text-teal-500 hover:underline">Planos</a> para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Visão Geral das Matérias</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Acompanhe seu progresso em todas as disciplinas.</p>
        </header>

        {/* Overall Stats Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <FaBookOpen className="text-3xl text-amber-500 mb-2" />
              <span className="text-3xl font-bold text-amber-500">{formatTime(overallStats.totalStudyTime)}</span>
              <span className="text-md text-gray-600 dark:text-gray-300">Total de Horas Estudadas</span>
            </div>
            <div className="flex flex-col items-center">
              <FaQuestionCircle className="text-3xl text-amber-500 mb-2" />
              <span className="text-3xl font-bold text-amber-500">{overallStats.totalQuestions}</span>
              <span className="text-md text-gray-600 dark:text-gray-300">Total de Questões Resolvidas</span>
            </div>
            <div className="flex flex-col items-center">
              <FaChartLine className="text-3xl text-amber-500 mb-2" />
              <span className="text-3xl font-bold text-amber-500">{overallStats.overallPerformance}%</span>
              <span className="text-md text-gray-600 dark:text-gray-300">Desempenho Geral</span>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSubjects.map(subject => {
            const stats = subjectStats[subject.name] || { totalStudyTime: 0, totalQuestions: 0, performance: 0 };
            return (
              <div 
                key={subject.name} 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col relative overflow-hidden"
                style={{ borderLeft: `8px solid ${subject.color}` }}
                onMouseEnter={() => setHoveredSubject(subject.name)}
                onMouseLeave={() => setHoveredSubject(null)}
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{subject.name}</h3>
                
                <div className="flex justify-around items-center w-full text-center mb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatTime(stats.totalStudyTime)}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Horas Estudadas</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.totalQuestions}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Questões</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.performance}%</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Desempenho</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-200">Presente nos Planos:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subject.plans.map(planName => (
                      <span key={planName} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {planName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div 
                  className={`absolute inset-0 flex flex-row items-center justify-center gap-4 transition-all duration-300 ease-in-out 
                    ${hoveredSubject === subject.name ? 'opacity-100' : 'opacity-0'}`}
                  style={{ backgroundColor: `${subject.color}E6` }} // Usar a cor da disciplina com 90% de opacidade
                >
                  <button
                    onClick={() => router.push(`/materias/${encodeURIComponent(subject.name)}`)}
                    className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors shadow-md"
                    title="Visualizar Detalhes"
                  >
                    <FaEye size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}