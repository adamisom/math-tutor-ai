'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { SignInForm } from './signin-form';
import { SignUpForm } from './signup-form';

export function AuthBanner() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if loading, authenticated, or dismissed
  if (status === 'loading' || session?.user || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
        <span className="text-gray-700">
          <button
            onClick={() => setShowSignIn(true)}
            className="text-gray-700 hover:text-gray-900 underline"
          >
            log in / register
          </button>
          {' '}to save progress
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

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

