'use client';

import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { FaHome, FaClipboardList, FaBook, FaFileAlt, FaDatabase, FaRedoAlt, FaHistory, FaChartBar, FaCalendarAlt, FaGraduationCap, FaHeart } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsList } from 'react-icons/bs';
import ThemeToggleButton from './ThemeToggleButton';
import PlanSelector from './PlanSelector';
import { useTheme } from '../context/ThemeContext';
import { useSession, signOut } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';
import { useDonationModal } from '../context/DonationModalContext';

const Sidebar = () => {
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const { openModal } = useDonationModal();

  const logoSrc = theme === 'dark' ? '/logo-modo-escuro.svg' : '/logo.svg';

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}
      bg-amber-500 text-white w-72 p-4 transition-transform duration-300 ease-in-out z-50 flex flex-col dark:bg-gray-800 dark:text-gray-100`}>
      
      <div className="flex-grow">
        {/* Sidebar Header */}
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-white p-2 rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-white dark:hover:bg-gray-700 dark:focus:ring-gray-500">
            <BsList size={24} />
          </button>
          <div className="flex-grow flex justify-center">
            <img src={logoSrc} alt="Estudei Logo" className="h-20 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <Link href="/dashboard" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/dashboard' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHome className="mr-2" />Home</Link>
            </li>
            <li className="mb-2">
              <Link href="/planos" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/planos' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaClipboardList className="mr-2" />Planos</Link>
            </li>
            <li className="mb-2">
              <Link href="/materias" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/materias' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaBook className="mr-2" />Matérias</Link>
            </li>
            
            <li className="mb-2">
              <Link href="/edital" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/edital' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaFileAlt className="mr-2" />Edital</Link>
            </li>
            
            <li className="mb-2">
              <Link href="/planejamento" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/planejamento' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaCalendarAlt className="mr-2" />Planejamento</Link>
            </li>
            <li className="mb-2">
              <Link href="/historico" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/historico' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHistory className="mr-2" />Histórico</Link>
            </li>
            <li className="mb-2">
              <Link href="/revisoes" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/revisoes' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaRedoAlt className="mr-2" />Revisões</Link>
            </li>
            <li className="mb-2">
              <Link href="/estatisticas" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/estatisticas' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaChartBar className="mr-2" />Estatísticas</Link>
            </li>
            <li className="mb-2">
              <Link href="/simulados" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/simulados' ? 'bg-amber-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaGraduationCap className="mr-2" />Simulados</Link>
            </li>
            <li className="mb-2">
              <button onClick={openModal} className={`w-full flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}>
                <FaHeart className="mr-2 text-gold-400 animate-bright-pulse" />Apoie o Projeto
              </button>
            </li>
            <li className="mb-2">
              <Link href="/backup" className={`flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 ${pathname === '/backup' ? 'bg-amber-600 dark:bg-gray-700' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaDatabase className="mr-2" />Backup</Link>
            </li>
            {session && (
              <li className="mb-2">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center p-2 rounded-md hover:bg-amber-600 transition-colors duration-200 w-full text-left dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100"
                >
                  <FaSignOutAlt className="mr-2" />Sair ({session.user?.name})
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-amber-400 dark:border-gray-700">
        <div className="flex items-center justify-between space-x-2">
          <ThemeToggleButton />
          <div className="flex-grow">
            <PlanSelector />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Sidebar;
