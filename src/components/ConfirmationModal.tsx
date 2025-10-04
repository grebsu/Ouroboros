'use client';

import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000080] z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </p>
              </div>
            </div>
             <button
                onClick={onClose}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Fechar"
              >
                <FaTimes size={20} />
              </button>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-500 dark:focus:ring-gray-400"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
