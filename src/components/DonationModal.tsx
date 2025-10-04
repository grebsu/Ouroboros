'use client';

import React from 'react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl text-gray-900 dark:text-white flex flex-col bg-white dark:bg-gray-800 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">&times;</button>
        <h2 className="text-2xl font-bold text-center mb-4">Apoie o Projeto</h2>
        <p className="text-center mb-4">Sua doação ajuda a manter o projeto ativo e em constante desenvolvimento. Muito obrigado!</p>
        <div className="flex justify-center">
          <img src="/qrcode-pix.png" alt="PIX QR Code" className="w-64 h-64" />
        </div>
        <p className="text-center mt-4 text-sm text-gray-500">Escaneie o QR code com seu aplicativo de banco.</p>
      </div>
    </div>
  );
};

export default DonationModal;
