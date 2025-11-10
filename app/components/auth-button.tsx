'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogIn, LogOut, User, X } from 'lucide-react';
import { SignInForm } from './signin-form';
import { SignUpForm } from './signup-form';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  if (status === 'loading') {
    return (
      <div className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg flex items-center gap-2">
        <User className="w-4 h-4 animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg">
          <User className="w-5 h-5" />
          <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSignIn(true)}
        className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        title="Sign in"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </button>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            <SignInForm
              onSuccess={() => setShowSignIn(false)}
              onCancel={() => setShowSignIn(false)}
              onSwitchToSignUp={() => {
                setShowSignIn(false);
                setShowSignUp(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowSignUp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
            <SignUpForm
              onSuccess={() => setShowSignUp(false)}
              onCancel={() => setShowSignUp(false)}
            />
            <div className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setShowSignUp(false);
                  setShowSignIn(true);
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
