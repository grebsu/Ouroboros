'use client';

import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Função auxiliar para formatar minutos em horas e minutos
const formatMinutesToHoursMinutes = (totalMinutes: number) => {
  if (totalMinutes < 0) return '0min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}min`;
  } else {
    return `${minutes}min`;
  }
};

const DailyStudySection = ({ dailySubjectStudyTime, subjectColors, className }) => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setCurrentDate(`${day}/${month}/${year}`);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysStudyData = dailySubjectStudyTime && dailySubjectStudyTime[today] ? dailySubjectStudyTime[today] : {};

  const subjectColorMap = subjectColors.reduce((acc, subject) => {
    acc[subject.subject] = subject.color;
    return acc;
  }, {});

  const studyData = Object.entries(todaysStudyData).map(([subject, time]) => ({
    subject,
    minutes: Math.round(time / 60000),
    color: subjectColorMap[subject] || '#d1d5db', // Cor padrão
  }));

  const totalStudyMinutes = studyData.reduce((acc, item) => acc + item.minutes, 0);

  const data = {
    labels: studyData.map(item => item.subject),
    datasets: [
      {
        data: studyData.map(item => item.minutes),
        backgroundColor: studyData.map(item => item.color),
        borderColor: studyData.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Desabilitar a legenda padrão do Chart.js
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${formatMinutesToHoursMinutes(value)}`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800 transition-colors duration-300 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        ESTUDOS DO DIA <span className="text-gray-600 dark:text-gray-400 text-lg">({currentDate})</span>
      </h2>
      <div className="flex-grow flex items-center justify-center relative h-64"> {/* Altura fixa para o gráfico */}
        <Pie data={data} options={options} />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Legenda:</h3>
        <ul className="space-y-1">
          {studyData.map((item, index) => (
            <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
              {item.subject}: {formatMinutesToHoursMinutes(item.minutes)}
            </li>
          ))}
        </ul>
        <p className="text-right text-gray-700 dark:text-gray-200 font-bold mt-2">
          Total: {formatMinutesToHoursMinutes(totalStudyMinutes)}
        </p>
      </div>
    </div>
  );
};

export default DailyStudySection;
