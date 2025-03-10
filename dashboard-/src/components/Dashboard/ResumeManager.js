import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthRequired from '../Auth/AuthRequired';
import { useNavigate } from 'react-router-dom';
import './ResumeManager.css';
import ErrorBoundary from './ErrorBoundary';

// Add SVG icons for the FAB menu
const PlusIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
  </svg>
);

const TemplateIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
  </svg>
);

const ResumeManager = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfErrors, setPdfErrors] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showComingSoonMessage, setShowComingSoonMessage] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResumes, setSelectedResumes] = useState(new Set());
  const [actionLoading, setActionLoading] = useState({});
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showDownloadAuthPopup, setShowDownloadAuthPopup] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  // Move fetchResumes outside of useEffect
  const fetchResumes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    setPdfErrors({});
    
    try {
      console.log(`Fetching resumes for user: ${currentUser.uid}`);
      const response = await fetch(`http://localhost:8000/get-resumes/${currentUser.uid}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Error fetching resumes: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log("Raw API response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      console.log("Parsed data:", data);
      
      if (!Array.isArray(data)) {
        if (data && Array.isArray(data.resumes)) {
          data = data.resumes;
          console.log("Using data.resumes array:", data);
        } else {
          console.error("Response is not an array and does not contain a resumes array:", data);
          throw new Error("Invalid response format from server");
        }
      }
      
      const specificFilename = "resume_20250303_005650_e0b9c48d.pdf";
      const filteredData = data.filter(resume => resume.filename !== specificFilename);
      
      if (filteredData.length < data.length) {
        console.log(`Filtered out specific resume: ${specificFilename}`);
      }
      
      const processedData = filteredData.map(resume => {
        console.log("Processing resume:", resume);
        
        // Ensure direct_download_url is present
        if (!resume.direct_download_url && resume.id && resume.user_id) {
          console.log("Creating direct_download_url for resume:", resume.id);
          resume.direct_download_url = `/direct-download/${resume.id}?user_id=${resume.user_id}`;
        }
        
        return {
          ...resume,
          hasValidBlob: isValidBlobUrl(resume.blob_url),
          blob_url: ensureSasToken(resume.blob_url),
          direct_download_url: resume.direct_download_url ? 
            ensureSasToken(resume.direct_download_url) : 
            `/direct-download/${resume.id}?user_id=${resume.user_id}`
        };
      });
      
      console.log("Processed resumes:", processedData);
      setResumes(processedData);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setError("Failed to load resumes. Please try again. Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeResumes = async () => {
      if (currentUser && mounted) {
        await fetchResumes();
      }
    };

    initializeResumes();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const handlePdfError = (resumeId) => {
    setPdfErrors(prev => ({
      ...prev,
      [resumeId]: true
    }));
    console.error(`Error loading PDF for resume ID: ${resumeId}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || 'Unknown date';
    }
  };

  const isValidBlobUrl = (url) => {
    if (!url) return false;
    
    // Check if the URL is a valid Azure Blob Storage URL
    const isAzureUrl = url.includes('blob.core.windows.net');
    console.log(`URL ${url} is ${isAzureUrl ? 'a valid' : 'not a valid'} Azure URL`);
    
    return isAzureUrl;
  };

  const ensureSasToken = (url) => {
    if (!url) return '';
    
    // For direct download URLs (from our API), return as is
    if (url.startsWith('/')) {
      console.log("Using direct download URL:", url);
      return `http://localhost:8000${url}`;
    }
    
    // Check if the URL already has a SAS token
    if (url.includes('?')) {
      console.log("URL already has query parameters:", url);
      return url;
    }
    
    // Add a dummy SAS token for testing
    // In production, this should be a valid SAS token from your backend
    console.log("Adding dummy SAS token to URL:", url);
    return `${url}?sv=2020-08-04&ss=b&srt=co&sp=rwdlacitfx&se=2023-12-31T23:59:59Z&st=2023-01-01T00:00:00Z&spr=https&sig=DUMMY_SIGNATURE`;
  };

  const handleFileChange = (e) => {
    // Check if files exist and if the first file exists
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      console.log("File selected:", e.target.files[0]);
    } else {
      console.log("No file selected");
    }
  };

  const handleUpload = async (resumeId) => {
    if (!currentUser || !selectedFile) return;
    
    setActionLoading(prev => ({ ...prev, [resumeId]: 'upload' }));
    
    try {
      console.log(`Uploading file for resume ID: ${resumeId}`);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', currentUser.uid);
      
      const response = await fetch(`http://localhost:8000/upload-resume-pdf/${resumeId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Error uploading file: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("File uploaded successfully:", data);
      
      fetchResumes();
      
      setUploadingFor(null);
      setSelectedFile(null);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again. Error: " + error.message);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[resumeId];
        return newState;
      });
    }
  };

  const startUpload = (resumeId) => {
    setUploadingFor(resumeId);
  };

  const cancelUpload = () => {
    setUploadingFor(null);
    setSelectedFile(null);
  };

  // Function to delete a resume
  const deleteResume = async (resumeId) => {
    if (!currentUser) return;
    
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [resumeId]: 'delete' }));
    
    try {
      console.log(`Deleting resume with ID: ${resumeId}`);
      const response = await fetch(`http://localhost:8000/delete-resume/${resumeId}?user_id=${currentUser.uid}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Error deleting resume: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Resume deleted:", data);
      
      setResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
      
    } catch (error) {
      console.error("Error deleting resume:", error);
      setError("Failed to delete resume. Please try again. Error: " + error.message);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[resumeId];
        return newState;
      });
    }
  };

  // Function to toggle the create resume popup
  const toggleCreatePopup = () => {
    if (!currentUser) {
      setShowAuthPopup(true);
      return;
    }
    setShowCreatePopup(!showCreatePopup);
    // Reset coming soon message when closing the popup
    if (showCreatePopup) {
      setShowComingSoonMessage(false);
    }
  };

  // Function to handle the "Select a resume" option
  const handleSelectResume = () => {
    toggleCreatePopup(); // Close the popup
    // Navigate to the homepage with a query parameter to open the resume creation form
    navigate('/homePage?openResumeForm=true');
  };

  // Function to handle the "Start From Scratch" option
  const handleStartFromScratch = () => {
    setShowComingSoonMessage(true);
    // You can implement the actual functionality in the future
  };

  // Function to toggle FAB menu
  const toggleFabMenu = () => {
    setFabMenuOpen(!fabMenuOpen);
  };

  // Function to handle resume sorting
  const handleSort = (order) => {
    setSortOrder(order);
    const sortedResumes = [...resumes].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
    setResumes(sortedResumes);
  };

  // Function to handle resume search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter resumes based on search query
  const filteredResumes = resumes.filter(resume => 
    resume.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle bulk actions
  const handleBulkAction = (action) => {
    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedResumes.size} resume(s)?`)) {
        selectedResumes.forEach(id => deleteResume(id));
        setSelectedResumes(new Set());
      }
    }
  };

  const handleDownload = async (e, resumeUrl, resumeId, userId, filename) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log("Download requested:", { resumeUrl, resumeId, userId, filename });
    
    if (!currentUser || !currentUser.uid) {
      console.log("User not authenticated, showing login popup");
      setPendingDownload({ url: resumeUrl, resumeId, userId, filename });
      setShowDownloadAuthPopup(true);
      return;
    }

    if (actionLoading[resumeId]) {
      console.log("Already downloading, skipping request");
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [resumeId]: 'download' }));
      
      // Always prefer direct download URL
      let downloadUrl;
      if (resumeUrl.startsWith('/direct-download/')) {
        downloadUrl = `http://localhost:8000${resumeUrl}`;
        console.log("Using API direct download URL:", downloadUrl);
      } else if (resumeId && userId) {
        // Create a direct download URL if we have resumeId and userId
        downloadUrl = `http://localhost:8000/direct-download/${resumeId}?user_id=${userId}`;
        console.log("Created direct download URL from ID:", downloadUrl);
      } else {
        // Fallback to the original URL (should rarely happen)
        downloadUrl = resumeUrl;
        console.log("Falling back to original URL:", downloadUrl);
      }
      
      console.log(`Making fetch request to: ${downloadUrl}`);
      
      // Proceed with download
      const response = await fetch(downloadUrl);
      console.log("Fetch response:", { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers])
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log("Authentication failed during download");
          setPendingDownload({ url: resumeUrl, resumeId, userId, filename });
          setShowDownloadAuthPopup(true);
          throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log("Received blob:", { 
        type: blob.type, 
        size: blob.size 
      });
      
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element for the download
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename || 'resume.pdf';
      document.body.appendChild(link);
      console.log("Triggering download with filename:", link.download);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      console.log("Download complete");
      
    } catch (error) {
      console.error('Download error:', error);
      setError(error.message || 'Failed to download resume. Please try again.');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[resumeId];
        return newState;
      });
    }
  };

  // Add handleAuthSuccess function
  const handleAuthSuccess = () => {
    setShowAuthPopup(false);
    setShowCreatePopup(true);
  };

  // Add handleDownloadAuthSuccess function
  const handleDownloadAuthSuccess = async () => {
    setShowDownloadAuthPopup(false);
    if (pendingDownload) {
      await handleDownload(
        new Event('click'),
        pendingDownload.url,
        pendingDownload.resumeId,
        pendingDownload.userId,
        pendingDownload.filename
      );
      setPendingDownload(null);
    }
  };

  return (
    <ErrorBoundary>
      <AuthRequired>
        <div className="resume-manager">
          {/* Search and Filter Bar */}
          <div className="resume-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="view-controls">
              <button
                className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
            <div className="sort-controls">
              <select value={sortOrder} onChange={(e) => handleSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedResumes.size > 0 && (
            <div className="bulk-actions">
              <span>{selectedResumes.size} selected</span>
              <button onClick={() => handleBulkAction('delete')}>Delete Selected</button>
            </div>
          )}

          {/* Existing Content */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your resumes...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <div className="error-actions">
                <button onClick={fetchResumes} className="retry-button">
                  Retry
                </button>
              </div>
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="empty-state">
              <h3>No resumes found</h3>
              <p>Create a new resume to get started</p>
            </div>
          ) : (
            <div className={`pdf-${viewMode}`}>
              {filteredResumes.map((resume) => (
                <div 
                  key={resume.id} 
                  className={`pdf-card ${selectedResumes.has(resume.id) ? 'selected' : ''} ${actionLoading[resume.id] ? 'loading' : ''}`}
                  onClick={() => {
                    if (!actionLoading[resume.id]) {
                      const newSelected = new Set(selectedResumes);
                      if (newSelected.has(resume.id)) {
                        newSelected.delete(resume.id);
                      } else {
                        newSelected.add(resume.id);
                      }
                      setSelectedResumes(newSelected);
                    }
                  }}
                >
                  <div className="pdf-preview">
                    {!pdfErrors[resume.id] && (
                      <div className="pdf-container">
                        <object
                          className="resume-pdf-preview"
                          type="application/pdf"
                          data-resume-id={resume.id}
                          data-filename={resume.filename}
                          data-created-at={resume.created_at}
                          data-status={resume.status}
                          onError={() => handlePdfError(resume.id)}
                          src={`${resume.direct_download_url ? ensureSasToken(resume.direct_download_url) : ensureSasToken(resume.blob_url)}#toolbar=0&navpanes=0`}
                        >
                          <p>Your browser does not support PDFs. <a href={resume.direct_download_url ? ensureSasToken(resume.direct_download_url) : ensureSasToken(resume.blob_url)}>Download the PDF</a>.</p>
                        </object>
                      </div>
                    )}
                  </div>
                  <div className="pdf-info">
                    <h3 className="pdf-title">{resume.filename || 'Unnamed Resume'}</h3>
                    <p className="pdf-date">Created: {formatDate(resume.created_at)}</p>
                    {(pdfErrors[resume.id] || !resume.hasValidBlob) && uploadingFor !== resume.id && (
                      <p className="pdf-error">PDF not available in Azure storage</p>
                    )}
                  </div>
                  <div className="pdf-actions">
                    {resume.hasValidBlob && !pdfErrors[resume.id] ? (
                      <>
                        <a 
                          href={resume.direct_download_url ? ensureSasToken(resume.direct_download_url) : ensureSasToken(resume.blob_url)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`view-button ${actionLoading[resume.id] ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!actionLoading[resume.id]) {
                              window.open(resume.direct_download_url ? ensureSasToken(resume.direct_download_url) : ensureSasToken(resume.blob_url), '_blank');
                            }
                          }}
                        >
                          View
                        </a>
                        <button 
                          className={`download-button ${actionLoading[resume.id] === 'download' ? 'loading' : ''} ${!currentUser ? 'disabled' : ''}`}
                          onClick={(e) => handleDownload(
                            e, 
                            resume.direct_download_url || resume.blob_url, 
                            resume.id,
                            currentUser?.uid,
                            resume.filename
                          )}
                          disabled={!currentUser || actionLoading[resume.id] === 'download'}
                          title={!currentUser ? 'Please log in to download' : 'Download resume'}
                        >
                          {actionLoading[resume.id] === 'download' ? 'Downloading...' :
                          !currentUser ? 'Login to Download' : 'Download'}
                        </button>
                        <button 
                          className={`delete-button ${actionLoading[resume.id] === 'delete' ? 'loading' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!actionLoading[resume.id]) {
                              deleteResume(resume.id);
                            }
                          }}
                          disabled={actionLoading[resume.id]}
                        >
                          {actionLoading[resume.id] === 'delete' ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    ) : uploadingFor === resume.id ? (
                      <div className="upload-info">
                        {actionLoading[resume.id] === 'upload' ? 'Uploading...' : 'Select a PDF file to upload'}
                      </div>
                    ) : (
                      <button 
                        className={`upload-pdf-button ${actionLoading[resume.id] === 'upload' ? 'loading' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (!actionLoading[resume.id]) {
                            startUpload(resume.id);
                          }
                        }}
                        disabled={actionLoading[resume.id]}
                      >
                        {actionLoading[resume.id] === 'upload' ? 'Uploading...' : 'Upload PDF'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Auth Popup */}
          {showAuthPopup && (
            <div className="auth-popup-overlay">
              <div className="auth-popup">
                <div className="popup-header">
                  <h3>Authentication Required</h3>
                  <button className="close-popup-button" onClick={() => setShowAuthPopup(false)}>×</button>
                </div>
                <div className="popup-content">
                  <p className="auth-message">Please log in or sign up to create a new resume.</p>
                  <div className="auth-buttons">
                    <button className="login-button" onClick={() => {
                      // Trigger your login flow here
                      handleAuthSuccess();
                    }}>
                      Login
                    </button>
                    <button className="signup-button" onClick={() => {
                      // Trigger your signup flow here
                      handleAuthSuccess();
                    }}>
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Floating Action Button Menu */}
          <div className={`fab-menu ${fabMenuOpen ? 'active' : ''}`}>
            <button 
              className="fab-button" 
              onClick={toggleFabMenu}
              title={!currentUser ? "Login required to create resume" : "Create new resume"}
            >
              <PlusIcon />
            </button>
            <div className="fab-menu-items">
              <div 
                className={`fab-menu-item ${!currentUser ? 'disabled' : ''}`} 
                onClick={toggleCreatePopup}
              >
                <UploadIcon />
                <span>{!currentUser ? 'Login to Upload Resume' : 'Upload Resume'}</span>
              </div>
              <div 
                className={`fab-menu-item ${!currentUser ? 'disabled' : ''}`}
                onClick={handleStartFromScratch}
              >
                <TemplateIcon />
                <span>{!currentUser ? 'Login to Create Resume' : 'Create from Template'}</span>
              </div>
            </div>
          </div>

          {/* Existing Create Resume Popup */}
          {showCreatePopup && (
            <div className="create-resume-overlay">
              <div className="create-resume-popup">
                <div className="popup-header">
                  <h3>Create New Resume</h3>
                  <button className="close-popup-button" onClick={toggleCreatePopup}>×</button>
                </div>
                <div className="popup-content">
                  <h4>How do you want to get started?</h4>
                  {showComingSoonMessage && (
                    <div className="coming-soon-message">
                      <p>This feature is coming soon! Please use the "Select a resume" option for now.</p>
                    </div>
                  )}
                  <div className="resume-options">
                    <div className="resume-option" onClick={handleSelectResume}>
                      <div className="option-icon">📄</div>
                      <h5>Select a resume</h5>
                      <p>Select from the existing library or upload a new file</p>
                    </div>
                    <div className="resume-option" onClick={handleStartFromScratch}>
                      <div className="option-icon">✏️</div>
                      <h5>Start From Scratch</h5>
                      <p>Build your resume using our resume builder</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AuthRequired>
    </ErrorBoundary>
  );
};

export default ResumeManager; 