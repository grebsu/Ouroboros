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
        <h2 className="text-2xl font-bold text-center mb-4">Apoie a Missão Ouroboros</h2>
        <p className="text-center mb-6 text-base">
          Ouroboros é uma aplicação <strong>open-source e gratuita</strong> de planejamento de estudos, com foco na <strong>democratização do acesso a ferramentas de alta performance</strong> para estudantes e concurseiros.
          <br/><br/>
          Sua doação nos ajuda a manter e evoluir a plataforma, apoiando diretamente <strong>estudantes hipossuficientes</strong> a terem acesso a recursos de qualidade para transformar seu futuro.
        </p>
        <div className="flex justify-center">
          <img src="/qrcode-pix.png" alt="PIX QR Code" className="w-64 h-64" />
        </div>
        <p className="text-center mt-4 text-sm text-gray-500">Escaneie o QR code com seu aplicativo de banco.</p>
      </div>
    </div>
  );
};

export default DonationModal;
