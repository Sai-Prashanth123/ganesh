import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ResumeStats.css';

const ResumeStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalResumes: 0,
    fileTypes: {},
    uploadsByMonth: {},
    latestUpload: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchResumeStats();
    }
  }, [currentUser]);

  const fetchResumeStats = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:8000/get-resumes/${currentUser.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      
      const data = await response.json();
      const resumes = data.resumes || [];
      
      // Calculate statistics
      const fileTypes = {};
      const uploadsByMonth = {};
      let latestUpload = null;
      
      resumes.forEach(resume => {
        // Count file types
        if (resume.filename) {
          const extension = resume.filename.split('.').pop().toLowerCase();
          fileTypes[extension] = (fileTypes[extension] || 0) + 1;
        }
        
        // Count uploads by month
        if (resume.created_at) {
          const date = new Date(resume.created_at);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          uploadsByMonth[monthYear] = (uploadsByMonth[monthYear] || 0) + 1;
          
          // Track latest upload
          if (!latestUpload || new Date(resume.created_at) > new Date(latestUpload.created_at)) {
            latestUpload = resume;
          }
        }
      });
      
      setStats({
        totalResumes: resumes.length,
        fileTypes,
        uploadsByMonth,
        latestUpload
      });
    } catch (error) {
      setError('Error fetching resume statistics: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="resume-stats-loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="resume-stats-error">{error}</div>;
  }

  return (
    <div className="resume-stats">
      <h3>Resume Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalResumes}</div>
          <div className="stat-label">Total Resumes</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">
            {stats.latestUpload ? formatDate(stats.latestUpload.created_at) : 'None'}
          </div>
          <div className="stat-label">Latest Upload</div>
        </div>
        
        <div className="stat-card file-types">
          <h4>File Types</h4>
          <ul>
            {Object.entries(stats.fileTypes).map(([type, count]) => (
              <li key={type}>
                <span className="file-type">{type.toUpperCase()}</span>
                <span className="file-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="stat-card upload-history">
          <h4>Upload History</h4>
          <ul>
            {Object.entries(stats.uploadsByMonth)
              .sort((a, b) => {
                const [monthA, yearA] = a[0].split('/');
                const [monthB, yearB] = b[0].split('/');
                return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
              })
              .slice(0, 5)
              .map(([month, count]) => (
                <li key={month}>
                  <span className="month">{month}</span>
                  <span className="upload-count">{count} uploads</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeStats; 