
'use client';

import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../app/datepicker-custom.css';
import { StudySession } from '@/types/types';
import { FaBook, FaBullseye, FaChartLine, FaHistory, FaTimes, FaFileAlt, FaGavel, FaQuestionCircle, FaTag } from 'react-icons/fa';
import MultiSelectDropdown from './MultiSelectDropdown';

interface EditalTopic {
  topic_text: string;
}

interface EditalSubject {
  subject: string;
  topics: EditalTopic[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  sessions: StudySession[];
  availableCategories: string[];
  availableSubjects: string[];
  availableEditalData: EditalSubject[];
}

const categoryIcons: { [key: string]: JSX.Element } = {
  Teoria: <FaBook className="mr-2" />,
  Revisão: <FaHistory className="mr-2" />,
  Exercícios: <FaBullseye className="mr-2" />,
  Simulado: <FaChartLine className="mr-2" />,
  'Leitura de Lei': <FaFileAlt className="mr-2" />,
  Jurisprudência: <FaGavel className="mr-2" />,
  Questões: <FaQuestionCircle className="mr-2" />,
};

const categoryLabels: { [key: string]: string } = {
  Teoria: 'Teoria',
  Revisão: 'Revisão',
  Exercícios: 'Exercícios',
  Simulado: 'Simulado',
  'Leitura de Lei': 'Leitura de Lei',
  Jurisprudência: 'Jurisprudência',
  Questões: 'Questões',
};

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  sessions,
  availableCategories,
  availableSubjects,
  availableEditalData,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minDuration, setMinDuration] = useState<string>('');
  const [maxDuration, setMaxDuration] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [minPerformance, setMinPerformance] = useState('');
  const [maxPerformance, setMaxPerformance] = useState('');

  const topicsForSelectedSubject = useMemo(() => {
    if (selectedSubjects.length === 0 || !availableEditalData) {
      return [];
    }
    const topics = availableEditalData
      .filter((subjectData: EditalSubject) => selectedSubjects.includes(subjectData.subject))
      .flatMap((subjectData: EditalSubject) => 
        subjectData.topics.map((topic: EditalTopic) => `${subjectData.subject} - ${topic.topic_text}`)
      );
    return [...new Set(topics)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [availableEditalData, selectedSubjects]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onApply({
      startDate,
      endDate,
      minDuration: minDuration ? Number(minDuration) : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
      categories: selectedCategories,
      subjects: selectedSubjects,
      topics: selectedTopics,
      minPerformance: minPerformance ? Number(minPerformance) : undefined,
      maxPerformance: maxPerformance ? Number(maxPerformance) : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setMinDuration('');
    setMaxDuration('');
    setSelectedCategories([]);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setMinPerformance('');
    setMaxPerformance('');
    onApply({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-amber-200 dark:border-amber-700">
          <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-300">Filtros Avançados</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-transform duration-200 hover:scale-125">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-grow">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Período */}
            <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Período</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Data de Início"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  dateFormat="dd/MM/yyyy"
                  wrapperClassName="w-full"
                  withPortal
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Data de Fim"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  dateFormat="dd/MM/yyyy"
                  wrapperClassName="w-full"
                  withPortal
                />
              </div>
            </section>

            {/* Duração (minutos) */}
            <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Duração (minutos)</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minDuration}
                  onChange={(e) => setMinDuration(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                />
              </div>
            </section>

            {/* Desempenho */}
            <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Desempenho (%)</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPerformance}
                  onChange={(e) => setMinPerformance(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPerformance}
                  onChange={(e) => setMaxPerformance(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                />
              </div>
            </section>
          </div>

          {/* Categoria */}
          <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableCategories?.map(category => (
                    <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`flex items-center justify-center p-4 rounded-lg font-semibold text-base transition-all duration-200 border-2
                        ${selectedCategories.includes(category)
                            ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {categoryIcons[category] || <FaTag className="mr-2" />}
                        <span>{categoryLabels[category] || category}</span>
                    </button>
                ))}
            </div>
          </section>

          {/* Disciplina e Tópico */}
          <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Disciplina e Tópico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject-filter" className="block text-lg font-medium text-gray-700 dark:text-gray-100 mb-2">Disciplina</label>
                <MultiSelectDropdown
                  options={availableSubjects}
                  selectedOptions={selectedSubjects}
                  onChange={setSelectedSubjects}
                  placeholder="Selecione as Disciplinas"
                />
              </div>
              <div>
                <label htmlFor="topic-filter" className="block text-lg font-medium text-gray-700 dark:text-gray-100 mb-2">Tópico</label>
                <MultiSelectDropdown
                  options={topicsForSelectedSubject}
                  selectedOptions={selectedTopics}
                  onChange={setSelectedTopics}
                  placeholder="Selecione os Tópicos"
                  disabled={selectedSubjects.length === 0}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-amber-200 bg-amber-50/50 space-x-4 dark:border-amber-700 dark:bg-amber-900/50">
          <button onClick={handleClear} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 transition-colors duration-200">
            Limpar
          </button>
          <button onClick={handleApply} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg dark:bg-amber-700 dark:hover:bg-amber-800 transition-colors duration-200">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
