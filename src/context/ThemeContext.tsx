'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    // Sincroniza a cor da barra de título do Electron com o tema
    const lightBg = '#f59e0b';
    const darkBg = '#1F2937';
    const titleBarBg = theme === 'light' ? lightBg : darkBg;
    document.documentElement.style.setProperty('--title-bar-bg', titleBarBg);

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const colors = theme === 'light'
        ? { background: lightBg, symbols: '#FFFFFF' }       // Cores do modo claro
        : { background: darkBg, symbols: '#F3F4F6' };      // Cores do modo escuro
      
      (window as any).electronAPI.updateTitlebarColor(colors);
    }
  }, [theme]); // Executa sempre que o tema muda

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};