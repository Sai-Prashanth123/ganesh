import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPopup.css';

const AuthPopup = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await signup(email, password);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setError('');
      alert('Password reset email sent. Check your inbox.');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-popup-overlay">
      <div className="auth-popup">
        <div className="auth-popup-header">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
        <div className='forgot-password'>
          {isLogin && (
            
              <button 
                type="button" 
                className="forgot-password-button" 
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot Password?
              </button>
            )}
            </div>
          <div className="auth-actions">
            
            <button 
              type="submit" 
              className="auth-submit-button" 
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-button"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup; 