import React from 'react';
import './Navbar.css';
import logo from './nav-images/Group 18.png';
import exit_img from './nav-images/exit_img.png';
import menu_img from './nav-images/menu_img.png';
import profile_img from './nav-images/profile-pic.png';


const Navbar = ({ setIsShow }) => {
  return (
    <nav className='nav'>
      <img onClick={() => setIsShow(prev => !prev)} className='menu' src={menu_img} alt="Menu" />
      <a className='title' href='#'>
        <img src={logo} alt="Job Spring Logo" />
        <h2>Job Spring</h2>
      </a>
      <a className='logout' href='#'>
        <span>Logout</span>
        <img src={exit_img} className='exit_img' alt="Logout" />
        <img src={profile_img} className='profile_img' alt="Logout" />
      </a>
    </nav>
  );
};

export default Navbar;

