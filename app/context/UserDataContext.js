'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const UserDataContext = createContext()

export function UserDataProvider({ children }) {
  const [signUpData, setSignUpData] = useState({
    age: null,
    gender: null
  })

  // Load from localStorage on mount (for persistence between page changes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xquisito-signup-data')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setSignUpData(parsed)
        } catch (error) {
          console.error('Error parsing stored signup data:', error)
        }
      }
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xquisito-signup-data', JSON.stringify(signUpData))
    }
  }, [signUpData])

  const updateSignUpData = (data) => {
    setSignUpData(prev => ({ ...prev, ...data }))
  }

  const clearSignUpData = () => {
    setSignUpData({ age: null, gender: null })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xquisito-signup-data')
    }
  }

  return (
    <UserDataContext.Provider value={{
      signUpData,
      updateSignUpData,
      clearSignUpData
    }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const context = useContext(UserDataContext)
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}