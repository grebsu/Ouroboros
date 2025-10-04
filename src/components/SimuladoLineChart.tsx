'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';



interface SimuladoLineChartProps {
  labels: string[];
  performanceData: number[];
  scoreData: number[];
  chartType: 'desempenho' | 'pontuacao';
}

export default function SimuladoLineChart({ labels, performanceData, scoreData, chartType }: SimuladoLineChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: chartType === 'desempenho' ? 'Desempenho (%) ' : 'Pontuação Total',
        data: chartType === 'desempenho' ? performanceData : scoreData,
        borderColor: chartType === 'desempenho' ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)',
        backgroundColor: chartType === 'desempenho' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(153, 102, 255, 0.5)',
        tension: 0.3,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000, // milliseconds
      easing: 'easeInOutQuad',
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold',
          },
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
          },
        },
      },
      title: {
        display: true,
        text: chartType === 'desempenho' ? 'Desempenho dos Simulados ao Longo do Tempo' : 'Pontuação dos Simulados ao Longo do Tempo',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: (context) => {
          return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
        },
      },
      tooltip: {
        backgroundColor: (context) => {
          return document.documentElement.classList.contains('dark') ? '#334155' : '#F9FAFB'; // slate-700 for dark, gray-50 for light
        },
        titleFont: {
          size: 16,
          weight: 'bold',
        },
        bodyFont: {
          size: 14,
        },
        borderColor: '#6EE7B7', // Teal-300
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false, // Hide color box in tooltip
        titleColor: (context) => {
          return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
        },
        bodyColor: (context) => {
          return document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'; // gray-300 for dark, gray-700 for light
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Data do Simulado',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
          },
        },
        grid: {
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB'; // gray-600 for dark, gray-200 for light
          },
          borderColor: '#E5E7EB', // gray-200
        },
        ticks: {
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
          },
          font: {
            size: 12,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: chartType === 'desempenho' ? 'Desempenho (%) ' : 'Pontuação',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
          },
        },
        beginAtZero: true,
        grid: {
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB'; // gray-600 for dark, gray-200 for light
          },
          borderColor: '#E5E7EB', // gray-200
        },
        ticks: {
          color: (context) => {
            return document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#111827'; // gray-200 for dark, gray-900 for light
          },
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return Math.round(value);
          },
        },
      },
    },
    elements: {
      point: {
        backgroundColor: '#6EE7B7', // Teal-300
        borderColor: '#0D9488', // Teal-700
        borderWidth: 2,
        radius: 5,
        hoverRadius: 7,
      },
    },
  };

  return <Line data={data} options={options} />;
}