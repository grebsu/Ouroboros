import React, { useState, Fragment, useEffect } from 'react';
import {
  BsCheckLg, BsXLg, BsPlusCircleFill,
  BsChevronUp, BsChevronDown, BsTrashFill, BsGraphUp
} from 'react-icons/bs';
import { StudyRecord, EditalTopic as Topic } from '../context/DataContext';

interface TopicRowProps {
  topic: Topic;
  subjectName: string;
  level: number;
  onToggleCompletion: (subject: string, topic: string) => void;
  onOpenRegisterModal: (subject: string, topic: Topic) => void;
  onEditRecord?: (record: StudyRecord) => void; // Optional for materias page
  onOpenAddTopicModal?: (topic: Topic) => void; // Optional for materias page
  onOpenConfirmationModal?: (topic: Topic) => void; // Optional for materias page
  onOpenTopicWeightsModal?: (topic: Topic) => void; // Optional for materias page
  allTopicsExpanded?: boolean; // Optional prop for global expand/collapse
}

const TopicRow: React.FC<TopicRowProps> = ({
  topic,
  subjectName,
  level,
  onToggleCompletion,
  onOpenRegisterModal,
  onEditRecord,
  onOpenAddTopicModal,
  onOpenConfirmationModal,
  onOpenTopicWeightsModal,
  allTopicsExpanded, // Destructure the new prop
}) => {
  const [isExpanded, setIsExpanded] = useState(allTopicsExpanded !== undefined ? allTopicsExpanded : true);
  const hasSubtopics = topic.sub_topics && topic.sub_topics.length > 0;
  const isGroupingTopic = topic.is_grouping_topic || hasSubtopics;

  useEffect(() => {
    if (allTopicsExpanded !== undefined) {
      setIsExpanded(allTopicsExpanded);
    }
  }, [allTopicsExpanded]);

  const completed = topic.completed || 0;
  const reviewed = topic.reviewed || 0;
  const totalQuestions = completed + reviewed;
  const percentageCorrect = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;

  const getPerformanceTextColor = (p: number) => {
    if (p >= 80) return 'text-green-600';
    if (p >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Fragment>
      <tr className={`border-b border-gray-200 dark:border-gray-700 ${isGroupingTopic ? 'bg-gray-50 dark:bg-gray-800/50' : (topic.is_completed ? 'bg-gold-50 dark:bg-gold-900/50' : 'bg-white dark:bg-gray-800')}`}>
        <td className="p-2 dark:text-gray-100" style={{ paddingLeft: `${level * 20 + 8}px` }}>
          <div className="flex items-center">
            {hasSubtopics && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2 text-gray-500 dark:text-gray-400">
                {isExpanded ? <BsChevronDown /> : <BsChevronUp />}
              </button>
            )}
            <input
              type="checkbox"
              checked={topic.is_completed || false}
              onChange={() => onToggleCompletion(subjectName, topic.topic_text)}
              className={`mr-2 h-4 w-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500 accent-gold-500 ${isGroupingTopic ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              disabled={isGroupingTopic}
              title={isGroupingTopic ? 'Marque os subtópicos como concluídos.' : 'Marcar tópico como concluído'}
            />
            <span className={`text-gray-900 dark:text-gray-100 ${isGroupingTopic ? 'font-bold' : ''}`}>
              {isGroupingTopic ? `* ${topic.topic_text}` : topic.topic_text}
            </span>
          </div>
        </td>
        <td className="p-2 text-center font-bold text-green-600">{completed}</td>
        <td className="p-2 text-center font-bold text-red-600">{reviewed}</td>
        <td className="p-2 text-center text-gray-900 dark:text-gray-100">{totalQuestions}</td>
        <td className={`p-2 text-center font-bold ${getPerformanceTextColor(percentageCorrect)}`}>{percentageCorrect}</td>
        <td className="p-2 text-center text-gray-900 dark:text-gray-300">{formatDate(topic.last_study)}</td>
        <td className="p-2 text-center">
          <div className="flex items-center justify-center space-x-2">
            <button 
              onClick={() => onOpenRegisterModal(subjectName, topic)} 
              className={`text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-500 ${isGroupingTopic ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isGroupingTopic}
              title={isGroupingTopic ? 'Não é possível adicionar estudo a um tópico de agrupamento.' : 'Adicionar estudo a este Tópico'}
            >
              <BsPlusCircleFill />
            </button>
            {onOpenAddTopicModal && (
              <button onClick={() => onOpenAddTopicModal(topic)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500" title="Adicionar subtópico"><BsPlusCircleFill /></button>
            )}
            {onOpenConfirmationModal && (
              <button onClick={() => onOpenConfirmationModal(topic)} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500" title="Excluir tópico"><BsTrashFill /></button>
            )}
          </div>
        </td>
        {onOpenTopicWeightsModal && (
          <td className="p-2 text-center">
            <button 
              onClick={() => onOpenTopicWeightsModal(topic)} 
              className={`text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-500 ${isGroupingTopic ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isGroupingTopic}
              title={isGroupingTopic ? 'A relevância de um grupo é baseada em seus subtópicos.' : 'Ajustar Relevância do Tópico'}
            >
              <BsGraphUp />
            </button>
          </td>
        )}
      </tr>
      {topic.sub_topics && isExpanded && topic.sub_topics.map((subTopic, index) => (
        <TopicRow
          key={index}
          topic={subTopic}
          subjectName={subjectName}
          level={level + 1}
          onToggleCompletion={onToggleCompletion}
          onOpenRegisterModal={onOpenRegisterModal}
          onEditRecord={onEditRecord}
          onOpenAddTopicModal={onOpenAddTopicModal}
          onOpenConfirmationModal={onOpenConfirmationModal}
          onOpenTopicWeightsModal={onOpenTopicWeightsModal}
        />
      ))}
    </Fragment>
  );
};

export default TopicRow;