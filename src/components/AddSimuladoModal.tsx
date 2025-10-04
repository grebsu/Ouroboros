'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaMinusCircle, FaPercentage, FaStar, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { useData } from '../context/DataContext';

interface Subject {
  name: string;
  weight: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
}

interface AddSimuladoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSimulado?: SimuladoRecord | null; // Adicionado para edição
}

export default function AddSimuladoModal({ isOpen, onClose, initialSimulado }: AddSimuladoModalProps) {
  const { studyPlans, addSimuladoRecord, updateSimuladoRecord } = useData();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [examStyle, setExamStyle] = useState('Múltipla Escolha');
  const [simuladoName, setSimuladoName] = useState('');
  const [banca, setBanca] = useState('');
  const [timeSpent, setTimeSpent] = useState('00:00:00');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialSimulado) {
        // Preencher o formulário com os dados do simulado para edição
        setSelectedDate(initialSimulado.date);
        setExamStyle(initialSimulado.style);
        setSimuladoName(initialSimulado.name);
        setBanca(initialSimulado.banca);
        setTimeSpent(initialSimulado.timeSpent);
        setComments(initialSimulado.comments);
        setSubjects(initialSimulado.subjects);
      } else {
        // Resetar o formulário para um novo simulado
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setExamStyle('Múltipla Escolha');
        setSimuladoName('');
        setBanca('');
        setTimeSpent('00:00:00');
        setComments('');
        // Recarregar subjects do plano de estudos para um novo simulado
        if (studyPlans) {
          const subjectsMap = new Map<string, Subject>();
          studyPlans.forEach(plan => {
            plan.subjects?.forEach(subject => {
              if (!subjectsMap.has(subject.subject)) {
                subjectsMap.set(subject.subject, {
                  name: subject.subject,
                  weight: 1,
                  totalQuestions: 0,
                  correct: 0,
                  incorrect: 0,
                  color: subject.color, // Adiciona a cor da matéria
                });
              }
            });
          });
          setSubjects(Array.from(subjectsMap.values()));
        }
      }
    }
  }, [isOpen, initialSimulado, studyPlans]);

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    const numericValue = parseInt(value, 10);
    if (typeof newSubjects[index][field] === 'number') {
      (newSubjects[index] as any)[field] = isNaN(numericValue) ? 0 : numericValue;
    }
    setSubjects(newSubjects);
  };

  const handleDeleteSubject = (indexToDelete: number) => {
    setSubjects(subjects.filter((_, index) => index !== indexToDelete));
  };

  const totals = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      acc.totalQuestions += subject.totalQuestions;
      acc.correct += subject.correct;
      acc.incorrect += subject.incorrect;
      const subjectPoints = examStyle === 'Certo/Errado' ? subject.correct - subject.incorrect : subject.correct * subject.weight;
      acc.points += subjectPoints;
      return acc;
    }, { totalQuestions: 0, correct: 0, incorrect: 0, points: 0 });
  }, [subjects, examStyle]);

  const totalBlank = totals.totalQuestions - totals.correct - totals.incorrect;
  const totalPercentage = totals.totalQuestions > 0 ? Math.round((totals.correct / totals.totalQuestions) * 100) : 0;

  const handleSaveSimulado = async () => {
    const simuladoData = {
      date: selectedDate,
      name: simuladoName,
      style: examStyle,
      banca: banca,
      timeSpent: timeSpent,
      subjects: subjects.map(s => ({
        name: s.name,
        weight: s.weight,
        totalQuestions: s.totalQuestions,
        correct: s.correct,
        incorrect: s.incorrect,
        color: s.color || '#000000',
      })),
      comments: comments,
    };

    try {
      if (initialSimulado) {
        await updateSimuladoRecord({ ...simuladoData, id: initialSimulado.id });
      } else {
        await addSimuladoRecord(simuladoData);
      }
      onClose();
      // Reset form fields after successful save/update
      setSimuladoName('');
      setBanca('');
      setTimeSpent('00:00:00');
      setComments('');
      setSubjects([]); // This will reset the table
      setSelectedDate(new Date().toISOString().split('T')[0]); // Reset date
      setExamStyle('Múltipla Escolha'); // Reset exam style
    } catch (error) {
      console.error("Falha ao salvar/atualizar simulado do modal:", error);
      // Notification is handled by DataContext
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col transform transition-all duration-300 scale-95 animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <header className="flex justify-between items-center p-5 border-b border-gold-200 dark:border-gold-700 bg-gold-50 dark:bg-gold-900">
          <h2 className="text-2xl font-bold text-gold-800 dark:text-gold-200">Registrar Novo Simulado</h2>
          <button onClick={onClose} className="text-gold-600 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-200 transition-colors rounded-full p-2">
            <FaTimes size={20} />
          </button>
        </header>

        {/* Corpo do Modal */}
        <main className="p-6 space-y-6 overflow-y-auto dark:text-gray-100">
          <fieldset className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-4">
            <legend className="sr-only">Informações Gerais do Simulado</legend>
            
            {/* Date Selection */}
            <div>
              <label htmlFor="simulado-date" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Data</label>
              <div className="relative">
                <input 
                  id="simulado-date" 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gold-500 dark:border-gold-700 rounded-lg shadow-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition" 
                />
                <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none" />
              </div>
            </div>

            {/* Other Fields */}
            <div>
              <label htmlFor="simulado-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nome do Simulado</label>
              <input id="simulado-name" type="text" placeholder="Ex: Simulado Final SEFAZ" value={simuladoName} onChange={(e) => setSimuladoName(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gold-500 dark:border-gold-700 rounded-lg shadow-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition" />
            </div>
            <div>
              <label htmlFor="simulado-style" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Estilo de Prova</label>
              <select id="simulado-style" value={examStyle} onChange={(e) => setExamStyle(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gold-500 dark:border-gold-700 rounded-lg shadow-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition">
                <option>Múltipla Escolha</option>
                <option>Certo/Errado</option>
              </select>
            </div>
            <div>
              <label htmlFor="simulado-banca" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Banca</label>
              <input id="simulado-banca" type="text" placeholder="Ex: FGV" value={banca} onChange={(e) => setBanca(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gold-500 dark:border-gold-700 rounded-lg shadow-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition" />
            </div>
            <div>
              <label htmlFor="simulado-time" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tempo Gasto</label>
              <input id="simulado-time" type="text" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gold-500 dark:border-gold-700 rounded-lg shadow-sm text-center text-lg font-mono tracking-wider focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition" />
            </div>
          </fieldset>

          {/* Tabela de Disciplinas */}
          <div className="overflow-x-auto rounded-lg border border-gold-200 dark:border-gold-700 shadow-sm">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider">Disciplina</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider">Peso</th>
                  <th className="py-2 px-4 border-b border-gold-200 dark:border-gold-700 text-center text-sm font-semibold text-gold-800 dark:text-gold-200"><FaPencilAlt className="inline-block mr-1" /></th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider" title="Acertos"><FaCheckCircle className="text-green-500 mx-auto" /></th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider" title="Erros"><FaTimesCircle className="text-red-500 mx-auto" /></th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider" title="Em Branco"><FaMinusCircle className="text-gray-400 mx-auto" /></th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider" title="Pontos"><FaStar className="text-yellow-500 mx-auto" /></th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gold-800 dark:text-gold-200 uppercase tracking-wider" title="Desempenho"><FaPercentage className="text-blue-500 mx-auto" /></th>
                  <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subjects.map((subject, index) => {
                  const blankQuestions = subject.totalQuestions - subject.correct - subject.incorrect;
                  const subjectPoints = examStyle === 'Certo/Errado' ? subject.correct - subject.incorrect : subject.correct * subject.weight;
                  const percentage = subject.totalQuestions > 0 ? Math.round((subject.correct / subject.totalQuestions) * 100) : 0;
                  
                  return (
                    <tr key={subject.name} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" style={{ borderLeft: `4px solid ${subject.color}` }}>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{subject.name}</td>
                      <td className="p-2"><input type="number" value={subject.weight} onChange={(e) => handleSubjectChange(index, 'weight', e.target.value)} className="w-20 p-2 text-center bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gold-500 dark:border-gold-700 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500" /></td>
                      <td className="p-2"><input type="number" value={subject.totalQuestions} onChange={(e) => handleSubjectChange(index, 'totalQuestions', e.target.value)} className="w-20 p-2 text-center bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gold-500 dark:border-gold-700 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500" /></td>
                      <td className="p-2"><input type="number" value={subject.correct} onChange={(e) => handleSubjectChange(index, 'correct', e.target.value)} className="w-20 p-2 text-center bg-green-50 dark:bg-green-900/50 dark:text-gray-100 border-gold-500 dark:border-gold-700 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" /></td>
                      <td className="p-2"><input type="number" value={subject.incorrect} onChange={(e) => handleSubjectChange(index, 'incorrect', e.target.value)} className="w-20 p-2 text-center bg-red-50 dark:bg-red-900/50 dark:text-gray-100 border-gold-500 dark:border-gold-700 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" /></td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-600 dark:text-gray-300">{blankQuestions < 0 ? 'N/A' : blankQuestions}</td>
                      <td className="py-3 px-4 text-center font-bold text-lg text-yellow-600 dark:text-yellow-400">{subjectPoints}</td>
                      <td className="py-3 px-4 text-center font-bold text-lg text-blue-600 dark:text-blue-400">{percentage}%</td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => handleDeleteSubject(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-200 dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200">
                <tr>
                    <td colSpan={2} className="py-3 px-4 text-right text-sm uppercase">Totais</td>
                    <td className="py-3 px-4 text-center text-lg">{totals.totalQuestions}</td>
                    <td className="py-3 px-4 text-center text-lg text-green-600 dark:text-green-400">{totals.correct}</td>
                    <td className="py-3 px-4 text-center text-lg text-red-600 dark:text-red-400">{totals.incorrect}</td>
                    <td className="py-3 px-4 text-center text-lg text-gray-600 dark:text-gray-300">{totalBlank < 0 ? 'N/A' : totalBlank}</td>
                    <td className="py-3 px-4 text-center text-lg text-yellow-600 dark:text-yellow-400">{totals.points}</td>
                    <td className="py-3 px-4 text-center text-lg text-blue-600 dark:text-blue-400">{totalPercentage}%</td>
                    <td className="py-3 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Comentários */}
          <div>
            <label htmlFor="simulado-comments" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Comentários</label>
            <textarea id="simulado-comments" placeholder="Adicione observações sobre o simulado, pontos a melhorar, etc." rows={3} value={comments} onChange={(e) => setComments(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"></textarea>
          </div>
        </main>

        {/* Rodapé */}
        <footer className="flex justify-end items-center p-5 bg-gold-50 dark:bg-gold-900 border-t border-gold-200 dark:border-gold-700 rounded-b-xl">
          <button onClick={onClose} className="px-6 py-2 font-semibold text-gray-700 bg-gray-300 rounded-lg mr-2 hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">
            Cancelar
          </button>
          <button onClick={handleSaveSimulado} className="px-8 py-2 font-semibold text-white bg-gold-600 rounded-lg shadow-md hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all transform hover:scale-105 dark:bg-gold-700 dark:hover:bg-gold-800">
            Salvar Simulado
          </button>
        </footer>
      </div>
    </div>
  );
}

