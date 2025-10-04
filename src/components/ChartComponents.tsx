'use client';

import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, TooltipItem } from 'chart.js';

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart: Chart) {
    if (chart.config.options.elements && chart.config.options.elements.center) {
      // Get context and parameters
      const ctx = chart.ctx;
      const centerConfig = chart.config.options.elements.center;
      const fontStyle = centerConfig.fontStyle || 'Arial';
      const txt = centerConfig.text;
      const color = centerConfig.color || '#000';

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

      // Set font settings to draw it in the center
      ctx.font = `bold ${centerConfig.fontSize}px ${fontStyle}`;
      ctx.fillStyle = color;

      // Draw text in center
      ctx.fillText(txt, centerX, centerY);
    }
  }
};

interface ChartComponentsProps {
  stats: {
    totalCorrectQuestions: number;
    totalQuestions: number;
    dailyStudyTime: Record<string, number>;
    totalStudyTime: number;
    uniqueStudyDays: number;
  };
}

const ChartComponents: React.FC<ChartComponentsProps> = ({ stats }) => {
  const [chartJsLoaded, setChartJsLoaded] = useState(false);

  useEffect(() => {
    setChartJsLoaded(true);
  }, []);

  // Dados para o Doughnut Chart (Desempenho Geral)
  const doughnutData = {
    labels: ['Acertos', 'Erros'],
    datasets: [
      {
        data: [stats.totalCorrectQuestions, stats.totalQuestions - stats.totalCorrectQuestions],
                backgroundColor: ['rgb(245, 158, 11)', 'rgb(255, 99, 132)'],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(234, 179, 8, 1)',
        ],
      },
    ],
  };

  const correctPercentage = stats.totalQuestions > 0 ? ((stats.totalCorrectQuestions / stats.totalQuestions) * 100).toFixed(1) : '0.0';

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        },
        titleColor: '#4B5563',
        bodyColor: '#4B5563',
      }
    },
    elements: {
      center: {
        text: `${correctPercentage}%`,
        color: '#f59e0b', // amber-500
        fontStyle: 'Arial',
        fontSize: 24,
      }
    }
  };

  if (!chartJsLoaded) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando gráficos...</p></div>;
  }

  return (
    <div className="w-full h-full flex-grow flex items-center justify-center">
      <Doughnut data={doughnutData} options={doughnutOptions} plugins={[centerTextPlugin]} />
    </div>
  );
};

export default ChartComponents;