'use client';

import React, { useMemo } from 'react';

interface StudySession {
  id: any;
  subject: string;
  duration: number;
  color: string;
}

interface DonutChartProps {
  cycle: StudySession[];
  size?: number;
  studyHours: string;
  hoveredSession: number | null;
  setHoveredSession: (index: number | null) => void;
  sessionProgressMap: { [key: string]: number };
}

const DonutChart: React.FC<DonutChartProps> = ({ cycle, size = 300, studyHours, hoveredSession, setHoveredSession, sessionProgressMap }) => {
  const strokeWidth = 40;
  const gap = 5;

  const mainRingRadius = size / 2 - strokeWidth - gap;
  const progressRingRadius = size / 2 - (strokeWidth / 2);

  const mainCircumference = 2 * Math.PI * mainRingRadius;
  const progressCircumference = 2 * Math.PI * progressRingRadius;

  const formatStudyHours = (hours: string) => {
    const hoursInt = parseInt(hours, 10);
    if (isNaN(hoursInt)) return '0h00min';
    return `${hoursInt}h00min`;
  };

  const segments = useMemo(() => {
    if (!cycle || cycle.length === 0) return [];
    const totalSessions = cycle.length;
    const mainSegmentLength = mainCircumference / totalSessions;
    const progressSegmentLength = progressCircumference / totalSessions;
    let offset = 0;

    return cycle.map(session => {
      const progress = sessionProgressMap[session.id as string] || 0;
      const isCompleted = progress >= session.duration;
      const mainOffset = -offset * (mainCircumference / progressCircumference);
      const progressOffset = -offset;
      offset += progressSegmentLength;

      return {
        ...session,
        isCompleted,
        main: {
          key: `main-${session.id}`,
          strokeDasharray: `${mainSegmentLength} ${mainCircumference - mainSegmentLength}`,
          strokeDashoffset: mainOffset,
          color: isCompleted ? 'transparent' : session.color,
        },
        progress: {
          key: `progress-${session.id}`,
          strokeDasharray: `${progressSegmentLength} ${progressCircumference - progressSegmentLength}`,
          strokeDashoffset: progressOffset,
          color: isCompleted ? '#22c55e' : 'transparent',
        },
      };
    });
  }, [cycle, mainCircumference, progressCircumference, sessionProgressMap]);

  const hoveredData = hoveredSession !== null && cycle[hoveredSession] ? cycle[hoveredSession] : null;

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={progressRingRadius} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={mainRingRadius} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth} />

        {segments.map(segment => (
          <circle
            key={segment.progress.key}
            cx={size / 2}
            cy={size / 2}
            r={progressRingRadius}
            fill="transparent"
            stroke={segment.progress.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.progress.strokeDasharray}
            strokeDashoffset={segment.progress.strokeDashoffset}
            style={{ transition: 'stroke 0.5s ease' }}
          />
        ))}

        {segments.map((segment, index) => (
          <circle
            key={segment.main.key}
            cx={size / 2}
            cy={size / 2}
            r={mainRingRadius}
            fill="transparent"
            stroke={segment.main.color}
            strokeWidth={hoveredSession === index && !segment.isCompleted ? strokeWidth + 10 : strokeWidth}
            strokeDasharray={segment.main.strokeDasharray}
            strokeDashoffset={segment.main.strokeDashoffset}
            onMouseEnter={() => !segment.isCompleted && setHoveredSession(index)}
            onMouseLeave={() => setHoveredSession(null)}
            style={{ transition: 'stroke-width 0.2s, stroke 0.3s ease' }}
          />
        ))}

        <circle cx={size / 2} cy={size / 2} r={mainRingRadius - (strokeWidth / 2)} fill="#e5e7eb" />

        <text
          x={size / 2}
          y={size / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          fill="#374151"
          fontSize="24"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {formatStudyHours(studyHours)}
        </text>
      </svg>
      {hoveredData && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-white rounded-lg shadow-lg pointer-events-none"
        >
          <div className="flex items-center mb-2">
            <div style={{ width: '16px', height: '16px', backgroundColor: hoveredData.color, marginRight: '8px', borderRadius: '50%' }}></div>
            <p className="font-bold text-gray-800">{hoveredData.subject}</p>
          </div>
          <p className="text-sm text-gray-600">Duração: {hoveredData.duration} min</p>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
