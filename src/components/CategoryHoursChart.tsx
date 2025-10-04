'use client';

import React, { useEffect, useRef } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
  Chart
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';



// Plugin customizado para desenhar os rótulos curvados
const curvedPointLabelsPlugin = {
  id: 'curvedPointLabels',
  afterDraw: (chart: Chart) => {
    const { ctx, scales: { r } } = chart;

    if (!r) {
      return;
    }

    const labels = chart.data.labels;
    if (!labels || labels.length === 0) {
      return;
    }

    ctx.save();
    const pointLabelFont = { size: 8, weight: 'bold' as const, family: 'Arial' };
    ctx.font = `${pointLabelFont.weight} ${pointLabelFont.size}px ${pointLabelFont.family}`;
    ctx.fillStyle = '#4B5563'; // Cor para ambos os modos (cinza médio-escuro)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelRadius = r.drawingArea - 5;

    labels.forEach((label, index) => {
      const angle = r.getIndexAngle(index) - (Math.PI / 4) - (35 * Math.PI / 180);
      const text = label.toString().toUpperCase();
      const characters = text.split('');
      const characterSpacing = (text.length > 10) ? 0.02 : 0.03; // Espaçamento angular entre as letras

      // Calcula a largura angular total da palavra
      const totalTextAngularWidth = (characters.length - 1) * characterSpacing;

      // Ajusta o ângulo inicial para centralizar a palavra no eixo
      const startAngleForWord = angle - (totalTextAngularWidth / 2);

      characters.forEach((char, i) => {
        const charAngle = startAngleForWord + i * characterSpacing; // Usa o ângulo inicial ajustado
        const x = r.xCenter + Math.cos(charAngle) * labelRadius;
        const y = r.yCenter + Math.sin(charAngle) * labelRadius;

        if (isNaN(x) || isNaN(y)) {
            return;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(charAngle + Math.PI / 2);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      });
    });

    ctx.restore();
  }
};

const CATEGORY_MAP: { [key: string]: string } = {
  teoria: 'TEORIA',
  revisao: 'REVISÃO',
  questoes: 'QUESTÕES',
  leitura_lei: 'LEITURA DE LEI',
  jurisprudencia: 'JURISPRUDÊNCIA',
};

interface CategoryHoursChartProps {
  categoryStudyHours: Record<string, number>;
}

const formatTimeLabel = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value % 1) * 60);
  if (minutes > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  }
  return `${hours}h`;
};

const EXAMPLE_DATA = {
  teoria: 8,
  revisao: 5.5,
  questoes: 12,
  leitura_lei: 7,
  jurisprudencia: 3,
};

const CategoryHoursChart: React.FC<CategoryHoursChartProps> = ({ categoryStudyHours }) => {
  

  const hasRealData = categoryStudyHours && Object.values(categoryStudyHours).some(value => value > 0);
  const dataToShow = hasRealData ? categoryStudyHours : EXAMPLE_DATA;

  // Define a ordem correta e garante a sincronia
  const orderedCategories = ['teoria', 'revisao', 'questoes', 'leitura_lei', 'jurisprudencia'];
  
  const chartData = {
    labels: orderedCategories.map(key => CATEGORY_MAP[key] || key),
    datasets: [{
      label: hasRealData ? 'Horas de Estudo' : 'Horas de Estudo (Exemplo)',
      data: orderedCategories.map(key => dataToShow[key] || 0),
      backgroundColor: 'rgba(245, 158, 11, 0.4)',
      borderColor: 'rgb(245, 158, 11)',
      pointBackgroundColor: 'rgb(245, 158, 11)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(245, 158, 11)',
      pointRadius: 5,
      pointHoverRadius: 9,
      fill: true,
      borderWidth: 3,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { display: true, color: '#D1D5DB', lineWidth: 1 },
        grid: { circular: true, color: '#D1D5DB' },
        suggestedMin: 0,
        ticks: {
          display: false,
        },
        pointLabels: {
          display: false, 
        },
      },
    },
    plugins: {
      title: {
        display: false,
        text: hasRealData ? 'Distribuição de Horas por Categoria' : 'Exemplo de Gráfico de Categorias',
        font: { size: 18, weight: 'bold' as const },
        color: '#4B5563',
        padding: {
          top: 10,
          bottom: 20,
        }
      },
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 14 },
          color: '#4B5563'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#334155',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => formatTimeLabel(context.raw as number),
        },
      },
      datalabels: {
        display: true,
        formatter: (value: number) => formatTimeLabel(value),
        color: '#4B5563',
        backgroundColor: (context: any) => {
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)';
        },
        borderRadius: 4,
        padding: 4,
        font: {
          weight: 'bold' as const,
          size: 12,
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Radar data={chartData} options={chartOptions as any} plugins={[curvedPointLabelsPlugin, ChartDataLabels]} />
    </div>
  );
};

export default CategoryHoursChart;
