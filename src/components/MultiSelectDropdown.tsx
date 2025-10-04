'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedOptions,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedOptions = selectedOptions.filter(item => item !== option);
    onChange(newSelectedOptions);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={dropdownRef}>
      <div
        onClick={handleToggle}
        className="mt-1 flex items-center w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 sm:text-sm cursor-pointer h-11 overflow-hidden"
      >
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map(option => (
              <span
                key={option}
                className="flex items-center gap-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100 text-xs font-semibold px-2 py-1 rounded-full truncate"
              >
                <span className="truncate">{option}</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                  onClick={(e) => handleRemoveOption(option, e)}
                />
              </span>
            ))
          )}
        </div>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-md max-h-60 overflow-auto">
          <ul>
            {options?.map(option => (
              <li
                key={option}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  readOnly
                  className="mr-2 form-checkbox h-4 w-4 text-amber-600 border-gray-300 dark:border-gray-500 rounded focus:ring-amber-500"
                />
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;