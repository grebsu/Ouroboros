'use client';

import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-orange-500 text-2xl mr-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Confirmar Importação</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <strong>AVISO:</strong> A importação de um arquivo substituirá <strong>TODOS</strong> os seus dados atuais. Esta ação não pode ser desfeita.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Deseja continuar?
        </p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportConfirmationModal;