'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DonationModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const DonationModalContext = createContext<DonationModalContextType | undefined>(undefined);

export const DonationModalProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <DonationModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </DonationModalContext.Provider>
  );
};

export const useDonationModal = () => {
  const context = useContext(DonationModalContext);
  if (context === undefined) {
    throw new Error('useDonationModal must be used within a DonationModalProvider');
  }
  return context;
};
