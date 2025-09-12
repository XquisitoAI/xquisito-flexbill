'use client';

import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { useTable } from "../context/TableContext";
import { useUserData } from "../context/UserDataContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useUserSync } from "../hooks/useUserSync";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { state } = useTable();
  const { signUpData, clearSignUpData } = useUserData();
  const { navigateWithTable } = useTableNavigation();
  const { saveUserToBackend, isSyncing, syncStatus, isUserSynced, userData } = useUserSync(signUpData);
  const restaurantData = getRestaurantData();
  const { signOut } = useClerk();
  const router = useRouter();

  

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Not authenticated (shouldn't happen but good fallback)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <button 
            onClick={() => navigateWithTable('/checkout')}
            className="bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleContinueToPayment = () => {
    navigateWithTable('/payment');
  };

  const handleSignOut = async () => {
    try {
      // Construct the redirect URL with table context
      const redirectUrl = state.tableNumber 
        ? `/menu?table=${state.tableNumber}`
        : '/menu';
      
      console.log('🚪 Signing out and redirecting to:', redirectUrl);
      
      // Sign out with custom redirect URL
      await signOut({
        redirectUrl: redirectUrl
      });
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Fallback: navigate manually if sign out fails
      navigateWithTable('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} tableNumber={state.tableNumber} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Welcome {user.firstName || user.fullName || user.emailAddresses[0]?.emailAddress}!
                </h1>
                <p className="text-gray-600">
                  {state.tableNumber ? `Table ${state.tableNumber}` : 'Xquisito'}
                </p>
              </div>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>

        {/* Sync Status Alert */}
        {!isUserSynced && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-800 font-medium text-sm">
                  {isSyncing ? 'Syncing your profile data...' : 'Profile data sync pending'}
                </p>
                <p className="text-yellow-600 text-xs">
                  {isSyncing ? 'Please wait while we save your information' : 'Your profile data will be saved automatically'}
                </p>
              </div>
              {!isSyncing && (
                <button 
                  onClick={saveUserToBackend}
                  className="ml-auto px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        )}

        {syncStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-medium text-sm">Profile data synchronized successfully!</p>
            </div>
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium text-sm">Failed to sync profile data</p>
                <p className="text-red-600 text-xs">Check the console for more details</p>
              </div>
              <button 
                onClick={saveUserToBackend}
                disabled={isSyncing}
                className="ml-auto px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* User Information Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Profile Information
              </h2>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isUserSynced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isUserSynced ? 'Synced' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-800">{user.fullName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-800">{user.emailAddresses[0]?.emailAddress || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-800">{user.phoneNumbers[0]?.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-800">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Account Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-gray-800 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-gray-800">{user.username || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Verified</label>
                <p className="text-gray-800">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.emailAddresses[0]?.verification?.status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailAddresses[0]?.verification?.status === 'verified' ? 'Verified' : 'Pending'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Sign In</label>
                <p className="text-gray-800">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            What would you like to do?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={handleContinueToPayment}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors group"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200">
                <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Continue to Payment</p>
                <p className="text-sm text-gray-600">Pay for your order</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/menu')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">View Menu</p>
                <p className="text-sm text-gray-600">Browse our dishes</p>
              </div>
            </button>

            <button
              onClick={() => navigateWithTable('/cart')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">View Cart</p>
                <p className="text-sm text-gray-600">Review your order</p>
              </div>
            </button>
          </div>

          {/* Sign Out Option */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}