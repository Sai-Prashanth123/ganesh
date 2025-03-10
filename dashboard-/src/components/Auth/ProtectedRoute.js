import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthPopup from './AuthPopup';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(!currentUser);

  if (!currentUser) {
    if (!showAuthPopup) {
      return <Navigate to="/" />;
    }
    
    return (
      <>
        <AuthPopup 
          onClose={() => setShowAuthPopup(false)} 
          onSuccess={() => setShowAuthPopup(false)}
        />
        <div style={{ filter: 'blur(5px)' }}>
          {children}
        </div>
      </>
    );
  }

  return children;
};

export default ProtectedRoute; 