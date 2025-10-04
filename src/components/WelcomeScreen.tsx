'use client';

import React from 'react';
import { FaPlus } from 'react-icons/fa';

interface WelcomeScreenProps {
  onOpenModal: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenModal }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Bem-vindo ao seu Planejador de Estudos!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Pronto para organizar sua rotina e alcançar seus objetivos? Crie um novo ciclo de estudos para começar.</p>
        <button 
          onClick={onOpenModal} 
          className="bg-teal-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg dark:bg-teal-600 dark:hover:bg-teal-700"
        >
          <FaPlus className="inline-block mr-3" />
          Criar Novo Ciclo de Estudos
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
