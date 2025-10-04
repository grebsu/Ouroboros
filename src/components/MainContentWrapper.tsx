'use client';

import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { BsList } from 'react-icons/bs';

const MainContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarExpanded, toggleSidebar } = useSidebar();

  return (
    <main
      className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-72' : 'ml-0'} relative bg-gray-100 dark:bg-gray-900 min-h-screen`}
    >
      {!isSidebarExpanded && (
        <button onClick={toggleSidebar} className="fixed top-4 left-0 py-2 px-6 bg-gold-500 text-white rounded-tr-full rounded-br-full shadow-md focus:outline-none focus:ring-2 focus:ring-gold-600 z-50 transition-all duration-300 ease-in-out dark:bg-gray-800 dark:focus:ring-gold-500">
          <BsList size={24} />
        </button>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </main>
  );
};

export default MainContentWrapper;