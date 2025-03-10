import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthPopup from './AuthPopup';

const AuthRequired = ({ children, fallback }) => {
  const { currentUser } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  if (!currentUser) {
    if (showAuthPopup) {
      return (
        <>
          <AuthPopup 
            onClose={() => setShowAuthPopup(false)} 
            onSuccess={() => setShowAuthPopup(false)}
          />
          <div style={{ filter: 'blur(5px)' }}>
            {fallback || children}
          </div>
        </>
      );
    }
    
    return (
      <div className="auth-required-container">
        <div className="auth-required-message">
          <h3>Authentication Required</h3>
          <p>You need to sign in to access this feature.</p>
          <button 
            className="auth-required-button"
            onClick={() => setShowAuthPopup(true)}
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthRequired; 