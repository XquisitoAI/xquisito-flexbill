'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../utils/api';

interface GuestContextType {
  isGuest: boolean;
  guestId: string | null;
  tableNumber: string | null;
  setAsGuest: (tableNumber?: string) => void;
  setAsAuthenticated: (userId: string) => void;
  clearGuestSession: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

interface GuestProviderProps {
  children: ReactNode;
}

export function GuestProvider({ children }: GuestProviderProps) {
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  // Initialize guest state on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGuestId = localStorage.getItem('xquisito-guest-id');
      const storedTableNumber = localStorage.getItem('xquisito-table-number');
      
      if (storedGuestId) {
        setIsGuest(true);
        setGuestId(storedGuestId);
        setTableNumber(storedTableNumber);
        console.log('🔄 Restored guest session:', { guestId: storedGuestId, tableNumber: storedTableNumber });
      }
    }
  }, []);

  const setAsGuest = (newTableNumber?: string) => {
    // Generate guest ID through apiService (which handles localStorage)
    const generatedGuestId = generateGuestId();
    
    setIsGuest(true);
    setGuestId(generatedGuestId);
    
    if (newTableNumber) {
      apiService.setTableNumber(newTableNumber);
      setTableNumber(newTableNumber);
    }

    console.log('👤 Set as guest user:', { 
      guestId: generatedGuestId, 
      tableNumber: newTableNumber 
    });
  };

  const setAsAuthenticated = (userId: string) => {
    // Clear guest session when user authenticates
    clearGuestSession();
    console.log('🔐 Set as authenticated user:', userId);
  };

  const clearGuestSession = () => {
    apiService.clearGuestSession();
    setIsGuest(false);
    setGuestId(null);
    setTableNumber(null);
    console.log('🗑️ Guest session cleared');
  };

  // Helper function to generate guest ID
  const generateGuestId = (): string => {
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('xquisito-guest-id');
      
      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('xquisito-guest-id', guestId);
      }
      
      return guestId;
    }
    return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const value: GuestContextType = {
    isGuest,
    guestId,
    tableNumber,
    setAsGuest,
    setAsAuthenticated,
    clearGuestSession,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}

// Custom hook to use guest context
export function useGuest(): GuestContextType {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}

// Helper hook to check if user is guest
export function useIsGuest(): boolean {
  const { isGuest } = useGuest();
  return isGuest;
}

// Helper hook to get guest info
export function useGuestInfo(): { guestId: string | null; tableNumber: string | null } {
  const { guestId, tableNumber } = useGuest();
  return { guestId, tableNumber };
}