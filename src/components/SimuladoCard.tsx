'use client';

import React, { useState } from 'react';
import { FaPencilAlt, FaTrash, FaCheckCircle, FaTimesCircle, FaMinusCircle, FaChevronDown, FaChevronUp, FaStar } from 'react-icons/fa';
import { SimuladoRecord, SimuladoSubject } from '../app/actions';

interface SimuladoCardProps {
  simulado: SimuladoRecord;
  onEdit: (simulado: SimuladoRecord) => void;
  onDelete: (simulado: SimuladoRecord) => void;
}

const formatTime = (timeStr: string): string => {
  // Assuming timeStr is in "HH:MM:SS" format
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    if (seconds > 0) return `${seconds}s`;
  }
  return '0m';
};

const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para garantir interpretação UTC
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500'; // Verde
  if (percentage >= 60) return 'bg-yellow-500'; // Amarelo
  return 'bg-red-500'; // Vermelho
};

export default function SimuladoCard({ simulado, onEdit, onDelete }: SimuladoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalQuestions = simulado.subjects.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = simulado.subjects.reduce((sum, s) => sum + s.correct, 0);
  const totalIncorrect = simulado.subjects.reduce((sum, s) => sum + s.incorrect, 0);
  const totalBlank = totalQuestions - totalCorrect - totalIncorrect;

  const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const totalScore = simulado.subjects.reduce((sum, sub) => {
    if (simulado.style === 'Certo/Errado') {
      return sum + (sub.correct - sub.incorrect);
    } else {
      return sum + (sub.correct * sub.weight);
    }
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 border border-gray-200 dark:border-gray-700">
      {/* Linha Superior */}
      <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Data */}
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDateDisplay(simulado.date)}</span>

        {/* Título e Subtítulo */}
        <div className="flex-1 text-center mx-4">
          <h3 className="text-lg font-bold text-teal-700 dark:text-teal-300">{simulado.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{simulado.style} • {simulado.banca}</p>
        </div>

        {/* Tempo e Ícones de Questões */}
        <div className="flex items-center space-x-3">
          {/* Tempo */}
          <div className="bg-gray-700 dark:bg-gray-600 text-white dark:text-gray-100 text-xs font-semibold rounded-full w-16 h-6 flex items-center justify-center">
            {formatTime(simulado.timeSpent)}
          </div>
          {/* Ícones de Questões */}
          <div className="flex items-center space-x-1">
            <span className="text-green-500 text-sm font-semibold">{totalCorrect}</span>
            <FaCheckCircle className="text-green-500 text-xs" />
            <span className="text-red-500 text-sm font-semibold">{totalIncorrect}</span>
            <FaTimesCircle className="text-red-500 text-xs" />
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{totalBlank}</span>
            <FaMinusCircle className="text-gray-500 dark:text-gray-400 text-xs" />
            <span className="text-yellow-600 text-sm font-semibold">{totalScore.toFixed(0)}</span>
            <FaStar className="text-yellow-500 text-xs" />
          </div>
          {/* Porcentagem Geral */}
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full flex items-center justify-center w-12 h-12">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{overallPercentage.toFixed(0)}%</p>
          </div>
        </div>

        {/* Ícones de Ação e Seta */}
        <div className="flex items-center space-x-2 ml-4">
          <button onClick={(e) => { e.stopPropagation(); onEdit(simulado); }} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            <FaPencilAlt size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(simulado); }} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
            <FaTrash size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
            {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Linha Inferior (Tabela de Disciplinas) */}
          {simulado.subjects.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Disciplina</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Peso</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">✓</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">X</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">∑</th>
                    <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {simulado.subjects.map((subject, index) => {
                    const subjectTotal = subject.totalQuestions;
                    const subjectCorrect = subject.correct;
                    const subjectPercentage = subjectTotal > 0 ? (subjectCorrect / subjectTotal) * 100 : 0;
                    const barColor = getPerformanceColor(subjectPercentage);

                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" style={{ borderLeft: `4px solid ${subject.color}` }}>
                        <td className="py-2 px-3 text-sm font-medium text-gray-800 dark:text-gray-100">{subject.name}</td>
                        <td className="py-2 px-3 text-center text-sm text-gray-700 dark:text-gray-200">{subject.weight}</td>
                        <td className="py-2 px-3 text-center text-sm text-green-600 font-semibold">{subject.correct}</td>
                        <td className="py-2 px-3 text-center text-sm text-red-600 font-semibold">{subject.incorrect}</td>
                        <td className="py-2 px-3 text-center text-sm text-gray-700 dark:text-gray-200 font-semibold">{subject.totalQuestions}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mr-2">
                              <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${subjectPercentage}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{subjectPercentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {simulado.comments && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200">
              <p className="font-semibold mb-1">Comentários:</p>
              <p>{simulado.comments}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}