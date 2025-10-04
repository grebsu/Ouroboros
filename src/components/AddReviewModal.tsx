'use client';

import React, { useState } from 'react';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (days: number) => void;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ isOpen, onClose, onSave }) => {
  const [days, setDays] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      setError('Por favor, insira um número válido de dias (maior que 0).');
      return;
    }
    onSave(numDays);
    setDays('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setDays('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Adicionar Revisão</h2>
        <div>
          <label htmlFor="review-days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantos dias para a próxima revisão?
          </label>
          <input
            type="number"
            id="review-days"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Ex: 7"
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white dark:bg-gray-700 dark:text-gray-100`}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end items-center mt-6 space-x-4">
          <button onClick={handleClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-gold-600 hover:bg-gold-700 text-white font-bold py-2 px-4 rounded-lg transition-colors dark:bg-gold-700 dark:hover:bg-gold-800">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReviewModal;