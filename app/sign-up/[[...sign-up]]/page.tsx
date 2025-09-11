'use client'

import { useState } from 'react'
import * as Clerk from '@clerk/elements/common'
import * as SignUp from '@clerk/elements/sign-up'
import { useUser } from '@clerk/nextjs'

export default function SignUpPage() {
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const { user } = useUser()

  const handleContinueSubmit = async () => {
    // Save custom fields to user metadata
    if (user && (age || gender)) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            age: age ? parseInt(age) : null,
            gender: gender || null
          }
        })
        console.log('✅ Custom fields saved to metadata:', { age, gender })
      } catch (error) {
        console.error('❌ Error saving custom fields:', error)
      }
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="text-8xl font-bold text-gray-400 transform rotate-12 absolute top-10 left-10">
          X
        </div>
        <div className="text-8xl font-bold text-gray-400 transform -rotate-12 absolute top-20 right-10">
          Q
        </div>
        <div className="text-8xl font-bold text-gray-400 transform rotate-45 absolute bottom-32 left-20">
          X
        </div>
        <div className="text-8xl font-bold text-gray-400 transform -rotate-45 absolute bottom-40 right-20">
          Q
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <SignUp.Root>
            
            <SignUp.Step name="start">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Join Xquisito
                </h1>
                <p className="text-gray-600">Create your account to get started</p>
              </div>

              {/* Social Login */}
              <div className="space-y-3 mb-6">
                <Clerk.Connection name="google" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Clerk.Connection>

                <Clerk.Connection name="microsoft" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M13 1h10v10H13z"/>
                    <path fill="#05a6f0" d="M1 13h10v10H1z"/>
                    <path fill="#ffba08" d="M13 13h10v10H13z"/>
                  </svg>
                  Sign up with Microsoft
                </Clerk.Connection>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Clerk.Field name="firstName" className="space-y-2">
                    <Clerk.Label className="block text-sm font-medium text-gray-700">Name *</Clerk.Label>
                    <Clerk.Input 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                    />
                    <Clerk.FieldError className="text-red-600 text-xs" />
                  </Clerk.Field>

                  <Clerk.Field name="lastName" className="space-y-2">
                    <Clerk.Label className="block text-sm font-medium text-gray-700">Last Name *</Clerk.Label>
                    <Clerk.Input 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                    />
                    <Clerk.FieldError className="text-red-600 text-xs" />
                  </Clerk.Field>
                </div>

                <Clerk.Field name="emailAddress" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Email Address *</Clerk.Label>
                  <Clerk.Input 
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                  />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>

                <Clerk.Field name="password" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Password *</Clerk.Label>
                  <Clerk.Input 
                    required
                    type="password" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                  />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Age *</label>
                      <select 
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select age</option>
                        {Array.from({ length: 83 }, (_, i) => 18 + i).map(ageOption => (
                          <option key={ageOption} value={ageOption}>{ageOption}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Gender *</label>
                      <select 
                        required
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              <SignUp.Action submit className="w-full bg-teal-700 text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors mt-6">
                Create Account
              </SignUp.Action>
            </SignUp.Step>

            <SignUp.Step name="continue">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Complete Your Profile
                </h1>
                <p className="text-gray-600">Tell us a bit more about yourself</p>
              </div>

              {/* <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <select 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select age</option>
                      {Array.from({ length: 83 }, (_, i) => 18 + i).map(ageOption => (
                        <option key={ageOption} value={ageOption}>{ageOption}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <Clerk.Field name="username" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Username (Optional)</Clerk.Label>
                  <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>
              </div> */}

              <SignUp.Action 
                submit 
                className="w-full bg-teal-700 text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors mt-6"
                onSubmit={handleContinueSubmit}
              >
                Continue
              </SignUp.Action>
            </SignUp.Step>

            <SignUp.Step name="verifications">
              <SignUp.Strategy name="phone_code">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Verify Your Phone
                  </h1>
                  <p className="text-gray-600">We sent a code to your phone number</p>
                </div>

                <Clerk.Field name="code" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Phone Code</Clerk.Label>
                  <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center text-lg tracking-widest" />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>

                <SignUp.Action submit className="w-full bg-teal-700 text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors mt-6">
                  Verify Phone
                </SignUp.Action>
              </SignUp.Strategy>

              <SignUp.Strategy name="email_code">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600">We sent a verification code to your email</p>
                </div>

                <Clerk.Field name="code" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Email Code</Clerk.Label>
                  <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center text-lg tracking-widest" />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>

                <SignUp.Action submit className="w-full bg-teal-700 text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors mt-6">
                  Verify Email
                </SignUp.Action>
              </SignUp.Strategy>
            </SignUp.Step>

            {/* CAPTCHA container */}
            <div id="clerk-captcha"></div>
          </SignUp.Root>
        </div>

        {/* XQUISITO Branding */}
        <div className="text-center mt-6">
          <h2 className="text-2xl font-bold text-gray-700 tracking-wider">
            XQUISITO
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            DONDE LA TECNOLOGÍA SE ENCUENTRA CON EL BUEN COMER
          </p>
        </div>
      </div>
    </div>
  )
}