'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { FaTrash } from 'react-icons/fa';

export default function PlanSelector() {
  const { selectedDataFile, setSelectedDataFile, availablePlans, deletePlan } = useData();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, planToDelete: string) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planToDelete.replace('.json', '')}"? Esta ação não pode ser desfeita.`)) {
      deletePlan(planToDelete);
    }
  };

  const handleDeselectClick = () => {
    setIsDeselectConfirmModalOpen(true);
  };

  const handleConfirmDeselect = () => {
    setSelectedDataFile(null); // Deseleciona o plano
    setIsDeselectConfirmModalOpen(false);
    setIsDropdownOpen(false); // Fecha o dropdown após deselecionar
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white dark:bg-gray-800 border border-gold-500 dark:border-gold-600 rounded-full py-2 px-4 text-gold-500 dark:text-gold-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md text-base font-medium appearance-none pr-8 w-full flex justify-between items-center"
      >
        <span className="block truncate">
          {selectedDataFile ? selectedDataFile.replace('.json', '').toUpperCase() : 'Selecione o Plano'}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.53 8.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.67-2.66a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {isDropdownOpen && (
        <div className="absolute z-20 bottom-full mb-2 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {availablePlans.map((plan) => (
            <div
              key={plan}
              onClick={() => {
                setSelectedDataFile(plan);
                setIsDropdownOpen(false);
              }}
              className="text-gray-900 dark:text-gray-100 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gold-100 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <span className="block whitespace-normal">
                {plan.replace('.json', '').toUpperCase()}
                {plan === selectedDataFile && <span className="ml-2 text-gold-500 dark:text-gold-400 font-semibold">(Ativo)</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      </div>
  );
}
