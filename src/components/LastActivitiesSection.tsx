import React from 'react';
import { useData } from '../context/DataContext';
import { FaBookOpen, FaQuestionCircle, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';

const LastActivitiesSection = () => {
  const { studyRecords, formatMinutesToHoursMinutes } = useData();

  const latestActivities = studyRecords
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Últimas Atividades</h2>
      {latestActivities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-8">Nenhuma atividade registrada ainda.</p>
      ) : (
        <ul className="space-y-4">
          {latestActivities.map((activity) => (
            <li key={activity.id} className="bg-gray-50 dark:bg-gray-700 border-l-4 border-gold-500 rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-1">
                <FaBookOpen className="text-gold-600 dark:text-gold-400 mr-3 text-xl" />
                <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{activity.subject}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-7 mb-2">{activity.topic}</p>
              <div className="ml-7 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <FaCalendarAlt className="text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="font-medium">Data:</span> {new Date(activity.date).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <FaBookOpen className="text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="font-medium">Tempo de Estudo:</span> {formatMinutesToHoursMinutes(activity.studyTime / 60000)}
                </p>
                {activity.questions && activity.questions.total > 0 && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <FaQuestionCircle className="text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="font-medium">Questões:</span> {activity.questions.total} ({activity.questions.correct} certas)
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {studyRecords.length > 2 && (
        <div className="text-center mt-6">
          <Link href="/historico" className="text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium text-sm">
            Ver Mais ({studyRecords.length - 2} sessões restantes)
          </Link>
        </div>
      )}
    </div>
  );
};

export default LastActivitiesSection;
