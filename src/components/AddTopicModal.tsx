'use client';

import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

import { Topic } from '../app/planos/[fileName]/page'; // Importar a interface Topic

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (topics: Topic[], shouldContinue: boolean) => void;
  existingTopics: Topic[];
  isViewMode?: boolean; // Nova propriedade para modo de visualização
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose, onAdd, existingTopics, isViewMode }) => {
  const { showNotification } = useNotification();
  const [content, setContent] = useState('');
  const [shouldContinue, setShouldContinue] = useState(false);

  if (!isOpen) return null;

// Componente auxiliar para renderizar tópicos em árvore
const TopicTreeItem: React.FC<{ topic: Topic; level: number }> = ({ topic, level }) => {
  return (
    <li>
      <span style={{ paddingLeft: `${level * 15}px` }}>{topic.topic_text}</span>
      {topic.sub_topics && topic.sub_topics.length > 0 && (
        <ul className="list-disc list-inside ml-4">
          {topic.sub_topics.map((subTopic, index) => (
            <TopicTreeItem key={index} topic={subTopic} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

  const handleAdd = () => {
    const lines = content.split('\n').map(line => line.trimEnd()); // Preserve leading spaces for indentation
    const newTopics: Topic[] = [];
    const stack: { level: number; topic: Topic }[] = [];

    lines.forEach(line => {
      if (!line.trim()) return; // Skip empty lines

      const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
      const topicText = line.trim();

      const newTopic: Topic = { topic_text: topicText, sub_topics: [] };

      while (stack.length > 0 && leadingSpaces <= stack[stack.length - 1].level) {
        stack.pop(); // Pop topics with higher or equal indentation
      }

      if (stack.length === 0) {
        newTopics.push(newTopic); // Top-level topic
      } else {
        stack[stack.length - 1].topic.sub_topics?.push(newTopic); // Add as sub-topic
      }

      stack.push({ level: leadingSpaces, topic: newTopic });
    });

    if (newTopics.length > 0) {
      onAdd(newTopics, shouldContinue); // Pass the hierarchical structure
      setContent(''); // Clear the field
      if (!shouldContinue) {
        onClose();
      }
    } else {
      showNotification('Adicione pelo menos um tópico.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{isViewMode ? 'Tópicos da Disciplina' : 'Tópico'}</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-bold text-teal-800 dark:text-teal-300 mb-2">
              TÓPICOS EXISTENTES
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-md p-2 h-48 overflow-y-auto dark:bg-gray-700 dark:border-gray-600">
              {existingTopics.length > 0 ? (
                <ul className="list-disc list-inside">
                  {existingTopics.map((topic, index) => (
                    <TopicTreeItem key={index} topic={topic} level={0} />
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic dark:text-gray-400">Nenhum tópico adicionado ainda.</p>
              )}
            </div>
          </div>

          {!isViewMode && (
            <div className="w-full md:w-1/2">
              <label htmlFor="topicContent" className="block text-sm font-bold text-teal-800 dark:text-teal-300 mb-2">
                CONTEÚDO
              </label>
              <textarea
                id="topicContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dica: Você pode fazer quebra de linha com Enter para adicionar mais de um tópico."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-teal-400"
                autoFocus
              />
            </div>
          )}
        </div>

        {!isViewMode && (
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="saveAndContinue"
              checked={shouldContinue}
              onChange={(e) => setShouldContinue(e.target.checked)}
              className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="saveAndContinue" className="ml-2 text-sm text-gray-700 dark:text-gray-100">
              SALVAR E CONTINUAR
            </label>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {isViewMode ? 'Fechar' : 'Cancelar'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTopicModal;
