'use client';

import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';



const WeeklyStudyChart = ({ dailyStudyHours, dailyQuestionStats }) => {
  const [viewMode, setViewMode] = useState('time'); // 'time' or 'questions'

  if (!dailyStudyHours || !dailyQuestionStats) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800 transition-colors duration-300 flex items-center justify-center h-80">
        <p className="text-gray-500">Carregando dados do gráfico...</p>
      </div>
    );
  }

  const processChartData = (dailyData, dataKey) => {
    const weekLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.

    // Adjust to have Sunday as the first day of the week
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - dayOfWeek);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const weeklyData = Array(7).fill(0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      if (dailyData && dailyData[dateString]) {
        if (dataKey === 'hours') {
          weeklyData[i] = parseFloat((dailyData[dateString] || 0).toFixed(1)); // Directly use the value for hours
        } else if (dataKey === 'total') {
          weeklyData[i] = dailyData[dateString].total || 0; // Use total for questions
        }
      }
    }
    return weeklyData;
  };

  const timeData = {
    labels: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
    datasets: [
      {
        label: 'Horas de Estudo',
        data: processChartData(dailyStudyHours, 'hours'),
        backgroundColor: '#fbbf24',
        borderColor: '#f59e0b',
        borderWidth: 1,
      },
    ],
  };

  const questionsData = {
    labels: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
    datasets: [
      {
        label: 'Questões Resolvidas',
        data: processChartData(dailyQuestionStats, 'total'), 
        backgroundColor: '#fcd34d',
        borderColor: '#eab308',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += viewMode === 'time' ? `${context.parsed.y.toFixed(1)}h` : `${context.parsed.y} questões`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#4b5563', // gray-700
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#4b5563', // gray-700
          callback: function(value) {
            return viewMode === 'time' ? `${value}h` : value;
          }
        },
        grid: {
          color: '#e5e7eb', // gray-200
        },
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800 transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ESTUDO SEMANAL</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('time')}
            className={`relative overflow-hidden group px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              viewMode === 'time'
                ? 'bg-gold-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
            <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
            <span className="relative">TEMPO</span>
          </button>
          <button
            onClick={() => setViewMode('questions')}
            className={`relative overflow-hidden group px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              viewMode === 'questions'
                ? 'bg-gold-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
            <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-80 transform -skew-x-30 transition-all duration-700 ease-in-out group-hover:left-[100%]"></span>
            <span className="relative">QUESTÕES</span>
          </button>
        </div>
      </div>
      <div className="relative h-64"> {/* Altura fixa para o gráfico */}
        <Bar data={viewMode === 'time' ? timeData : questionsData} options={options} />
      </div>
    </div>
  );
};

export default WeeklyStudyChart;
