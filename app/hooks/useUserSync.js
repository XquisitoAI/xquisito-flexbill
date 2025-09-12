import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export function useUserSync(additionalData = {}) {
  const { user, isLoaded } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const saveUserToBackend = async (customData = {}) => {
    if (!user || isSyncing) return

    // Merge additional data passed from components
    const mergedData = { ...additionalData, ...customData }

    try {
      setIsSyncing(true)
      setSyncStatus('saving')
      
      const userData = {
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: mergedData.age || user.unsafeMetadata?.age || null,
        gender: mergedData.gender || user.unsafeMetadata?.gender || null,
        phone: user.phoneNumbers?.[0]?.phoneNumber || null
      }


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Update Clerk metadata to mark as synced
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            backendUserId: result.user.id,
            syncedAt: new Date().toISOString()
          }
        })
        
        setSyncStatus('success')
      } else {
        setSyncStatus('error')
      }
    } catch (error) {
      setSyncStatus('error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-sync when user is loaded and not already synced
  useEffect(() => {
    if (isLoaded && user && !user.unsafeMetadata?.backendUserId && !isSyncing) {
      saveUserToBackend()
    }
  }, [isLoaded, user])

  return {
    saveUserToBackend,
    isSyncing,
    syncStatus,
    isUserSynced: !!user?.unsafeMetadata?.backendUserId,
    userData: {
      age: additionalData?.age || user?.unsafeMetadata?.age,
      gender: additionalData?.gender || user?.unsafeMetadata?.gender
    }
  }
}