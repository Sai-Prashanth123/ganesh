import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="user-profile">
      <div 
        className="user-profile-button" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-avatar">
          {currentUser.email.charAt(0).toUpperCase()}
        </div>
        <span className="user-email">{currentUser.email}</span>
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          {error && <div className="user-error">{error}</div>}
          <div className="dropdown-item user-info">
            <strong>Email:</strong> {currentUser.email}
          </div>
          <button 
            className="dropdown-item logout-button" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 