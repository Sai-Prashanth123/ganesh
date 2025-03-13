import React, { useState } from 'react';
import './Navbar.css';
import logo from './nav-images/Group 18.png';
import exit_img from './nav-images/exit_img.png';
import menu_img from './nav-images/menu_img.png';
import profile_img from './nav-images/profile-pic.png';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../Auth/UserProfile';
import AuthPopup from '../Auth/AuthPopup';

const Navbar = ({ setIsShow }) => {
  const { currentUser } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const handleLoginClick = () => {
    setShowAuthPopup(true);
  };

  return (
    <nav className='nav'>
      <img onClick={() => setIsShow(prev => !prev)} className='menu' src={menu_img} alt="Menu" />
      <a className='title' href='/'>
        <img src={logo} alt="Job Spring Logo" />
        <h2>Job Spring</h2>
      </a>
      
      {currentUser ? (
        <UserProfile />
      ) : (
        <div className='login-container'>
          <button className='login-button' onClick={handleLoginClick}>
            Login / Sign Up
          </button>
          {showAuthPopup && (
            <AuthPopup 
              onClose={() => setShowAuthPopup(false)} 
              onSuccess={() => setShowAuthPopup(false)}
            />
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

