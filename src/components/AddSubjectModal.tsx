'use client';

import React, { useState, useEffect } from 'react';
import AddTopicModal from './AddTopicModal'; // Import AddTopicModal
import { FaArrowUp, FaArrowDown, FaEdit, FaTrash } from 'react-icons/fa'; // Importar ícones
import { useNotification } from '../context/NotificationContext';
import { Topic } from '../app/planos/[fileName]/page'; // Importar a interface Topic

interface Subject {
  subject: string;
  topics: Topic[];
  color: string;
}

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectName: string, topics: Topic[], color: string) => void; // Atualizado para aceitar Topic[]
  initialSubjectData?: Subject;
}

const colors = [
  // Reds
  '#EF4444', '#F87171', '#DC2626', '#B91C1C',
  // Oranges
  '#F97316', '#FB923C', '#EA580C', '#C2410C',
  // Yellows
  '#F59E0B', '#FBBF24', '#D97706', '#B45309',
  // Greens
  '#84CC16', '#A3E635', '#65A30D', '#4D7C0F',
  '#22C55E', '#4ADE80', '#16A34A', '#15803D',
  // Golds
  '#FFD700', '#DAA520', '#B8860B', '#A52A2A',
  // Blues
  '#0EA5E9', '#38BDF8', '#0284C7', '#0369A1',
  '#3B82F6', '#60A5FA', '#2563EB', '#1D4ED8',
  // Purples
  '#8B5CF6', '#A78BFA', '#7C3AED', '#6D28D9',
  '#A855F7', '#C084FC', '#9333EA', '#7E22CE',
  // Pinks
  '#EC4899', '#F472B6', '#DB2777', '#BE185D',
];

// Função auxiliar para formatar tópicos recursivamente para o textarea
const formatTopicsRecursively = (topics: Topic[], level = 0): string => {
  return topics
    .map(topic => {
      const indent = '  '.repeat(level);
      const prefix = topic.is_grouping_topic ? '* ' : '';
      const subTopicsStr =
        topic.sub_topics && topic.sub_topics.length > 0
          ? `\n${formatTopicsRecursively(topic.sub_topics, level + 1)}`
          : '';
      return `${indent}${prefix}${topic.topic_text}${subTopicsStr}`;
    })
    .join('\n');
};

// Função auxiliar para parsear o conteúdo do textarea para a estrutura Topic[]
const parseTopicsFromString = (content: string): Topic[] => {
  const lines = content.split('\n');
  const newTopics: Topic[] = [];
  const stack: { level: number; topic: Topic }[] = [];

  lines.forEach(line => {
    if (!line.trim()) return;

    const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
    const level = Math.floor(leadingSpaces / 2);
    let topicText = line.trim();

    const isGroupingTopic = topicText.startsWith('*');
    if (isGroupingTopic) {
      topicText = topicText.substring(1).trim();
    }

    const newTopic: Topic = { 
      topic_text: topicText, 
      sub_topics: [],
      is_grouping_topic: isGroupingTopic 
    };

    while (stack.length > 0 && level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    if (stack.length > 0) {
      const parent = stack[stack.length - 1].topic;
      parent.sub_topics?.push(newTopic);
      // Mark parent as a grouping topic since it has children
      if (!parent.is_grouping_topic) {
        parent.is_grouping_topic = true;
      }
    } else {
      newTopics.push(newTopic);
    }

    stack.push({ level, topic: newTopic });
  });

  // Final pass to ensure any topic with sub-topics is marked as a grouping topic
  const ensureGroupingFlag = (topics: Topic[]) => {
    topics.forEach(topic => {
      if (topic.sub_topics && topic.sub_topics.length > 0) {
        topic.is_grouping_topic = true;
        ensureGroupingFlag(topic.sub_topics);
      }
    });
  };

  ensureGroupingFlag(newTopics);

  return newTopics;
};


const AddSubjectModal: React.FC<AddSubjectModalProps> = ({ isOpen, onClose, onSave, initialSubjectData }) => {
  const { showNotification } = useNotification();
  const [subjectName, setSubjectName] = useState('');
  const [topicsContent, setTopicsContent] = useState(''); // Estado para o conteúdo do textarea
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialSubjectData) {
        setSubjectName(initialSubjectData.subject);
        setSelectedColor(initialSubjectData.color || colors[0]);
        // Formata a estrutura de tópicos para o textarea
        setTopicsContent(formatTopicsRecursively(initialSubjectData.topics || []));
      } else {
        // Reseta para um novo formulário
        setSubjectName('');
        setTopicsContent('');
        setSelectedColor(colors[0]);
      }
    }
  }, [isOpen, initialSubjectData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (subjectName.trim()) {
      // Parseia o conteúdo do textarea de volta para a estrutura Topic[]
      const topics = parseTopicsFromString(topicsContent);
      onSave(subjectName.trim(), topics, selectedColor);
      onClose(); // Fecha o modal após salvar
    } else {
      showNotification('O nome da disciplina não pode estar vazio.', 'error');
    }
  };


  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-6xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Nova Disciplina</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-3/4">
            <label htmlFor="subjectName" className="block text-sm font-bold text-gold-800 dark:text-gold-300 mb-2">
              NOME DA DISCIPLINA
            </label>
            <input
              type="text"
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ex: Direito Constitucional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-gold-400"
              autoFocus
            />
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-sm font-bold text-gold-800 dark:text-gold-300 mb-2">
              SELECIONAR UMA COR
            </label>
            <div className="relative" ref={colorPickerRef}>
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 flex items-center justify-between dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-gold-400"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md" style={{ backgroundColor: selectedColor }}></span>
                  <span className="text-gray-700 dark:text-gray-100">Selecionar Cor...</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">▼</span>
              </button>
              {isColorPickerOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-full h-8 rounded-md border-2 ${
                          selectedColor === color ? 'border-gold-500 ring-2 ring-gold-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedColor(color);
                          setIsColorPickerOpen(false);
                        }}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <label htmlFor="customColor" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Cor Personalizada
                    </label>
                    <input
                      type="color"
                      id="customColor"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer dark:border-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="topicsContent" className="block text-sm font-bold text-gold-800 dark:text-gold-300 mb-2">
            TÓPICOS (use 2 espaços de indentação para subtópicos)
          </label>
          <textarea
            id="topicsContent"
            value={topicsContent}
            onChange={(e) => setTopicsContent(e.target.value)}
            placeholder="Ex:
1. Direito Constitucional
  1.1. Princípios Fundamentais
  1.2. Direitos e Garantias Fundamentais"
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-gold-400 font-mono text-sm"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubjectModal;