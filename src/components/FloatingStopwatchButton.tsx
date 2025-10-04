'use client';

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { StudyRecord } from '../context/DataContext';
import StopwatchModal from './StopwatchModal';
import StudyRegisterModal from './StudyRegisterModal';
import { FaStopwatch } from 'react-icons/fa';

interface FloatingStopwatchButtonProps {
  isVisible?: boolean;
}

const FloatingStopwatchButton: React.FC<FloatingStopwatchButtonProps> = ({ isVisible = true }) => {
  const { addStudyRecord } = useData();

  const [showStopwatchModal, setShowStopwatchModal] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [stopwatchModalSubject, setStopwatchModalSubject] = useState<string | undefined>(undefined);
  const [stopwatchTime, setStopwatchTime] = useState(0);

  const openStopwatchModal = () => {
    setStopwatchModalSubject(''); // Define um valor padrão
    setShowStopwatchModal(true);
  };

  const closeStopwatchModal = () => setShowStopwatchModal(false);

  const handleStopwatchSave = (time: number, subject?: string, topic?: string) => {
    const newRecord: Partial<StudyRecord> = {
      date: new Date().toISOString().split('T')[0],
      studyTime: time,
      subject: subject || '',
      topic: topic || '',
      questions: { correct: 0, total: 0 },
      material: '',
      category: 'teoria',
      notes: 'Estudo cronometrado.',
      reviewPeriods: [],
      teoriaFinalizada: false,
      countInPlanning: false,
      pages: [],
      videos: [],
    };
    setEditingRecord(newRecord as StudyRecord);
    setShowStopwatchModal(false);
    setIsRegisterModalOpen(true);
  };

  const handleSaveStudy = async (record: StudyRecord) => {
    const { id, ...recordWithoutId } = record;
    await addStudyRecord(recordWithoutId);
    setIsRegisterModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
      {/* Floating Action Button */}
      {isVisible && (
        <button onClick={openStopwatchModal} className="fixed bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg z-50 animate-float">
          <FaStopwatch className="h-6 w-6" />
        </button>
      )}

      {/* Modals */}
      {showStopwatchModal && (
        <StopwatchModal 
          isOpen={showStopwatchModal} 
          onClose={closeStopwatchModal} 
          onSaveAndClose={handleStopwatchSave} 
        />
      )}
      {isRegisterModalOpen && (
        <StudyRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSave={handleSaveStudy}
          initialRecord={editingRecord}
          showDeleteButton={false}
        />
      )}
    </>
  );
};

export default FloatingStopwatchButton;
