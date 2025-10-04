'use client';

import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAllDataModal: React.FC<DeleteAllDataModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');
  const isConfirmationTextMatched = inputValue === 'APAGAR TUDO';

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Atenção: Ação Irreversível</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Tem certeza absoluta que deseja apagar <strong>TODOS</strong> os seus dados? Esta ação não pode ser desfeita.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Para confirmar, digite "<strong>APAGAR TUDO</strong>" no campo abaixo:
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmationTextMatched}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed transition-colors"
          >
            Apagar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAllDataModal;