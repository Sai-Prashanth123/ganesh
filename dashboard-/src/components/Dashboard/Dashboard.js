import React, { useEffect, useState} from 'react'
import './Dashboard.css'
import illustration from './dashboard-img/illustrator.png'
import interview_illustration from './dashboard-img/interview-illustration.png'
import helpme_img from './dashboard-img/help me.png'
import comingSoon_img from './dashboard-img/commingSoon-img.png'
import notification_img from './dashboard-img/notification-img.png'
import cancel_img from './dashboard-img/cancel_img.png'
import upload_img from './dashboard-img/upload_img.png'
import scratchFile_img from './dashboard-img/scratchFile_img.png'
import back_img from './dashboard-img/back_img.png'
import uploadResume_img from './dashboard-img/uploadResume_img.png'
import rightTick_img from './dashboard-img/rightTick_img.png'
import card1_img from './dashboard-img/card1_img.png'
import share_img from './dashboard-img/share_img.png'
import cancelfeed_img from './dashboard-img/cancelfeed_img.png'
import feed_img from './dashboard-img/feedback_img.png'
import ratingStar_img from './dashboard-img/ratingStar_img.png'
import generalInterview_img from './dashboard-img/general-InterviewAI.png'
import specificInterview_img from './dashboard-img/specific-InterviewAI.png'
import dropdown_img from './dashboard-img/dropdown_img.png'
import { Link, useLocation } from 'react-router-dom'
import Interview from '../Interview'
import { useNavigate } from "react-router-dom";
import ResumeManager from './ResumeManager';
import { useAuth } from '../../contexts/AuthContext';
import AuthRequired from '../Auth/AuthRequired';

const Dashboard = (props) => {
  console.log("Props received:", props);
  const location = useLocation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Initialize state from localStorage if available
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState(() => {
    const savedData = localStorage.getItem('resumeData');
    return savedData ? JSON.parse(savedData) : null;
  });
  const [jobTitle, setJobTitle] = useState(() => {
    return localStorage.getItem('jobTitle') || "";
  });
  const [creationDate, setCreationDate] = useState(() => {
    return localStorage.getItem('creationDate') || "";
  });
  const [resumeFile, setResumeFile] = useState(null); // File object can't be stored in localStorage

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (resumeData) {
      localStorage.setItem('resumeData', JSON.stringify({
        title: resumeData.title,
        date: resumeData.date,
        isReady: resumeData.isReady
      }));
    }
  }, [resumeData]);

  useEffect(() => {
    if (jobTitle) {
      localStorage.setItem('jobTitle', jobTitle);
    }
  }, [jobTitle]);

  useEffect(() => {
    if (creationDate) {
      localStorage.setItem('creationDate', creationDate);
    }
  }, [creationDate]);
    
  // Add a debug function to log all storage locations
  const logStorageState = (prefix = "") => {
    console.log(`${prefix} Storage State:`, {
      localStorage: {
        optimizedPdfFilename: localStorage.getItem('optimizedPdfFilename'),
        resumeId: localStorage.getItem('optimizedResumeId'),
        userId: localStorage.getItem('userId')
      },
      sessionStorage: {
        optimizedPdfFilename: sessionStorage.getItem('optimizedPdfFilename'),
        resumeId: sessionStorage.getItem('optimizedResumeId'),
        userId: sessionStorage.getItem('userId')
      },
      resumeData: {
        ...resumeData
      },
      hasResumeFile: !!resumeFile
    });
  };

  // Enhanced handleSubmit function to ensure file data is properly saved
  const handleSubmit = async (e) => {
      e.preventDefault();
      logStorageState("Before submission");
      setResult('Preparing your resume for optimization...');
      setError(null);
      setIsLoading(true);

      const formData = new FormData(e.target);

      // Store the job title for display in the card
      const jobTitleValue = formData.get("title");
      console.log("Job title for resume:", jobTitleValue);
      setJobTitle(jobTitleValue);
      
      // Format today's date for display
      const today = new Date();
      const formattedDate = `Created ${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}, ${today.getFullYear()}`;
      setCreationDate(formattedDate);

      // 🔍 Debug: Log FormData content
      console.log("FormData content being submitted:");
      for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, typeof value === 'object' ? `File: ${value.name}` : value);
      }

      // Save the original file for later access even before API call
      const file = formData.get("file");
      if (file) {
          console.log("Saving original file for potential fallback:", file.name);
          
          // Store the file both in resumeFile state and as a Blob URL in sessionStorage
          setResumeFile(file);
          
          // Create a unique identifier for this upload
          const uploadId = `upload_${Date.now()}`;
          sessionStorage.setItem('lastUploadId', uploadId);
          
          // We can't store File objects directly, but we can keep metadata
          sessionStorage.setItem('lastUploadFilename', file.name);
          sessionStorage.setItem('lastUploadTime', new Date().toISOString());
      }

      // Check if required fields are missing
      const jobTitleInput = formData.get("title");
      const description = formData.get("description");

      if (!file || !jobTitleInput || !description) {
          setError("Missing required fields");
          setIsLoading(false);
          return;
      }

      // Make sure the title is included properly for the backend
      formData.append("jobTitle", jobTitleValue); // Add explicit job title field
      formData.append("file", file); // Ensure file is correctly attached

      try {
          console.log("Starting resume optimization...");
          
          // Create a sanitized job title for the filename
          const sanitizedJobTitle = jobTitleValue.replace(/\s+/g, '_').toLowerCase();
          
          // Update the UI to show processing status
          setResult('Processing your resume. This may take up to a minute...');
          
          // Send to backend for optimization using the correct endpoint
          console.log("Sending resume to backend for optimization...");
          
          const response = await fetch("http://localhost:8000/process-all/", {
              method: "POST",
              body: formData,
              signal: AbortSignal.timeout(60000) // 60-second timeout for processing
          });
          
          if (response.ok) {
              const data = await response.json();
              console.log("Backend processing complete:", data);
              
              // Store the original file for fallback
              setResumeFile(file);
              
              // Store the PDF filename from Azure Blob Storage for later use
              if (data.pdf_file_name) {
                  localStorage.setItem('optimizedPdfFilename', data.pdf_file_name);
                  console.log("Optimized PDF stored in Azure Blob Storage:", data.pdf_file_name);
                  
                  // Also store in sessionStorage as backup
                  sessionStorage.setItem('optimizedPdfFilename', data.pdf_file_name);
                  
                  // Store resume ID if available for direct download
                  if (data.resume_id) {
                      localStorage.setItem('optimizedResumeId', data.resume_id);
                      console.log("Resume ID stored for direct download:", data.resume_id);
                      
                      // Also store in sessionStorage as backup
                      sessionStorage.setItem('optimizedResumeId', data.resume_id);
                      
                      // Store user ID if available
                      if (data.user_id || (currentUser ? currentUser.uid : null)) {
                          localStorage.setItem('userId', data.user_id || (currentUser ? currentUser.uid : null));
                          // Also store in sessionStorage as backup
                          sessionStorage.setItem('userId', data.user_id || (currentUser ? currentUser.uid : null));
                      }
                  }
                  
                  // Save filenames in resumeData for future reference
                  setResumeData({
                      title: jobTitleValue,
                      date: formattedDate,
                      isReady: true,
                      pdf_file_name: data.pdf_file_name, // Store filename in resumeData
                      resume_id: data.resume_id // Store resume ID in resumeData
                  });
              } else {
                  console.warn("No PDF filename in response, using original file as fallback");
                  
                  // Even though there's no PDF filename, let's create one from the original file
                  // This ensures we have something to download later
                  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
                  const generatedFilename = `resume_${timestamp}_local.pdf`;
                  
                  // Store the generated filename
                  localStorage.setItem('optimizedPdfFilename', generatedFilename);
                  sessionStorage.setItem('optimizedPdfFilename', generatedFilename);
                  console.log("Generated and stored local filename:", generatedFilename);
                  
                  // Store original file reference
                  const fileBlob = file;
                  // Create a blob URL for the file (will be valid for current session)
                  const blobUrl = URL.createObjectURL(fileBlob);
                  sessionStorage.setItem('resumeBlobUrl', blobUrl);
                  console.log("Stored blob URL for resume:", blobUrl);
                  
                  // Save the file name and keep the resumeFile in state
                  setResumeFile(file);
                  
                  // Save basic resumeData with our generated filename
                  setResumeData({
                      title: jobTitleValue,
                      date: formattedDate,
                      isReady: true,
                      pdf_file_name: generatedFilename,
                      filename: file.name,
                      isLocalFile: true // Flag that this is a local file
                  });
                  
                  setResult('Resume created! You can download it from the homepage.');
              }
              
              // Close the current card and overlay
              setCard2Style(prevState => ({
                  ...prevState,            
                  display: "none"       
              }));
              document.getElementById("overlay").style.display = "none";
              
              // Short delay before navigation to show the success state and allow download to start
              setTimeout(() => {
                  setIsLoading(false);
                  // Navigate directly to homepage instead of opening phone number popup
                  navigate('/homePage');
              }, 3000); // Increased to give more time for download to begin
          } else {
              throw new Error(`Server returned ${response.status}: ${await response.text()}`);
          }
      } catch (error) {
          // Check specifically for timeout errors
          if (error.name === 'TimeoutError') {
              console.error("Request timed out. The server might still be processing your resume.");
              
              // Replace alert with status message in the loading UI
              setResult('The server is taking longer than expected. Attempting to download your resume...');
              
              // Store the original file for fallback
              setResumeFile(file);
              
              // Try to download the optimized resume anyway, it might be ready
              // Check multiple storage locations for resilience
              const optimizedPdfFilename = localStorage.getItem('optimizedPdfFilename') || 
                                          sessionStorage.getItem('optimizedPdfFilename');
                                          
              const resumeId = localStorage.getItem('optimizedResumeId') || 
                              sessionStorage.getItem('optimizedResumeId');
                              
              const userId = localStorage.getItem('userId') || 
                            sessionStorage.getItem('userId') || 
                            (currentUser ? currentUser.uid : null);
              
              // Log what we found
              console.log("Timeout recovery with:", {
                  optimizedPdfFilename,
                  resumeId,
                  userId
              });
              
              // Check if we have necessary data for download
              if (!optimizedPdfFilename && !resumeId) {
                  console.log("No optimized PDF filename or resumeId found after timeout");
                  setResult('Your resume is still processing. Please try again in a few moments.');
                  setTimeout(() => navigate('/homePage'), 3000);
                  return;
              }
              
              // If we have resumeId but no filename, we can still download
              if (!optimizedPdfFilename && resumeId) {
                  console.log("No optimized PDF filename found, but resumeId exists. Using direct download with ID.");
                  
                  // Use direct download with resumeId
                  const downloadUrl = `http://localhost:8000/direct-download/${resumeId}?user_id=${userId}`;
                  console.log("Using direct download endpoint with ID:", downloadUrl);
                  
                  // Create temporary link element for direct download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = downloadUrl;
                  downloadLink.target = '_blank';
                  downloadLink.download = `${jobTitleValue.replace(/\s+/g, '_').toLowerCase()}_optimized_resume.pdf`;
                  
                  // Append to the document, click it, and remove it
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  // Close the current card and overlay after a delay
                  setTimeout(() => {
                      setIsLoading(false);
                      navigate('/homePage');
                  }, 3000);
                  
                  return;
              }
              
              if (optimizedPdfFilename) {
                  // Try to download using our direct download endpoint
                  const sanitizedJobTitle = jobTitleValue.replace(/\s+/g, '_').toLowerCase();
                  
                  let downloadUrl;
                  if (resumeId && userId) {
                      // Use our direct download endpoint with resume ID
                      downloadUrl = `http://localhost:8000/direct-download/${resumeId}?user_id=${userId}`;
                      console.log("Using direct download endpoint:", downloadUrl);
                  } else {
                      // Fallback to the test-blob-access endpoint which can proxy the request
                      downloadUrl = `http://localhost:8000/test-blob-access?blob_url=https://pdf1.blob.core.windows.net/new/${optimizedPdfFilename}&download=true`;
                      console.log("Using blob access proxy endpoint:", downloadUrl);
                  }

                  console.log("Attempting to download despite timeout:", downloadUrl);
                  
                  // Create temporary link element for download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = downloadUrl;
                  downloadLink.target = '_blank'; // Open in new tab/trigger download
                  downloadLink.download = `${sanitizedJobTitle}_optimized_resume.pdf`;
                  
                  // Append to the document, click it, and remove it
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  setResult('Download attempted! Redirecting to homepage...');
              } else {
                  // Handle non-timeout errors
                  setError(error.message);
                  setIsLoading(false);
                  console.error("Error during submission:", error);
                  
                  // If there was a non-timeout error, download the original file
                  setResult('Error processing resume. Downloading your original file as a fallback...');
                  
                  // Store the original file for fallback if not already set
                  if (file && !resumeFile) {
                      setResumeFile(file);
                  }
                  
                  // Only attempt to download if we have a file
                  if (file) {
                      try {
                          // Download the original file
                          const sanitizedJobTitle = jobTitleValue.replace(/\s+/g, '_').toLowerCase();
                          const fileURL = URL.createObjectURL(file);
                          
                          // Create temporary link element
                          const downloadLink = document.createElement('a');
                          downloadLink.href = fileURL;
                          downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
                          
                          // Append to the document, click it, and remove it
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                          
                          // Revoke the URL to free up memory
                          setTimeout(() => URL.revokeObjectURL(fileURL), 100);
                          
                          setResult('Original file downloaded. Redirecting to homepage...');
                      } catch (downloadError) {
                          console.error("Error downloading original file:", downloadError);
                          setResult('Error downloading file. Please try again.');
                      }
                  }
                  
                  // Save basic resume data for display
                  setResumeData({
                      title: jobTitleValue,
                      date: formattedDate,
                      isReady: true
                  });
                  
                  // Close the current card and overlay after a short delay
                  setTimeout(() => {
                      setCard2Style(prevState => ({
                          ...prevState,            
                          display: "none"       
                      }));
                      document.getElementById("overlay").style.display = "none";
                      setIsLoading(false);
                      navigate('/homePage');
                  }, 3000); // Allow time for download to begin
              }
          }
      }
  };

  // Handle resume download - Now passes the event to helper functions
  const handleDownload = (event) => {
      if (!event || !event.isTrusted) {
          console.log("Download not triggered by user action, aborting");
          setResult('Please use the download button on the homepage to download your resume.');
          return;
      }
      
      // Log storage state before attempting download
      logStorageState("Download attempt");
      
      // Check authentication if needed
      if (!currentUser && !localStorage.getItem('userId') && !sessionStorage.getItem('userId')) {
          console.log("User is not authenticated and no userId in storage");
          setResult('Please log in to download your resume.');
          return;
      }
      
      if (resumeData && resumeData.title) {
          // Get the sanitized job title for the filename
          const sanitizedJobTitle = resumeData.title.replace(/\s+/g, '_').toLowerCase();
          
          // Try to download from storage first - try localStorage, then sessionStorage, then resumeData
          let optimizedPdfFilename = localStorage.getItem('optimizedPdfFilename') || 
                                    sessionStorage.getItem('optimizedPdfFilename') || 
                                    (resumeData.pdf_file_name ? resumeData.pdf_file_name : null);
                                    
          const resumeId = localStorage.getItem('optimizedResumeId') || 
                          sessionStorage.getItem('optimizedResumeId') || 
                          (resumeData.resume_id ? resumeData.resume_id : null);
                          
          const userId = localStorage.getItem('userId') || 
                        sessionStorage.getItem('userId') || 
                        (currentUser ? currentUser.uid : null);
          
          // Check if we have a local file flag in resumeData
          const isLocalFile = resumeData.isLocalFile;
          
          // Log what we found with extra details
          console.log("Download attempt details:", {
              optimizedPdfFilename,
              resumeId,
              userId,
              isLocalFile,
              resumeFile: resumeFile ? {
                  name: resumeFile.name,
                  size: resumeFile.size,
                  type: resumeFile.type,
                  lastModified: new Date(resumeFile.lastModified).toISOString()
              } : null,
              resumeData,
              blobUrl: sessionStorage.getItem('resumeBlobUrl')
          });

          // If we have a resumeFile and it's marked as a local file, use it directly
          if (resumeFile && isLocalFile) {
              console.log("Using local resumeFile for download");
              downloadLocalFile(event);
              return;
          }
          
          // Try to download from Azure API if we have a resumeId
          if (resumeId && userId) {
              console.log("Using resumeId to download from API directly");
              
              // Use direct download with resumeId - this should work even without optimizedPdfFilename
              const downloadUrl = `http://localhost:8000/direct-download/${resumeId}?user_id=${userId}`;
              console.log("Using direct download endpoint with ID:", downloadUrl);
              
              try {
                  // Create temporary link element for direct download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = downloadUrl;
                  downloadLink.target = '_blank';
                  downloadLink.download = `${sanitizedJobTitle}_optimized_resume.pdf`;
                  
                  setResult('Downloading your resume...');
                  
                  // Append to the document, click it, and remove it
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  console.log("Direct download initiated with resumeId");
                  return; // Exit early if we've initiated the download
              } catch (error) {
                  console.error("Error during direct resumeId download:", error);
                  // Continue to fallback mechanisms
              }
          }
          
          // If we have a filename but no resumeId, try the blob access endpoint
          if (optimizedPdfFilename && !resumeId) {
              console.log("Using optimizedPdfFilename without resumeId");
              
              const downloadUrl = `http://localhost:8000/test-blob-access?blob_url=https://pdf1.blob.core.windows.net/new/${optimizedPdfFilename}&download=true`;
              console.log("Using blob access proxy endpoint:", downloadUrl);
              
              try {
                  // Create temporary link element for direct download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = downloadUrl;
                  downloadLink.target = '_blank';
                  downloadLink.download = `${sanitizedJobTitle}_optimized_resume.pdf`;
                  
                  setResult('Downloading your resume...');
                  
                  // Append to the document, click it, and remove it
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  console.log("Blob access download initiated with optimizedPdfFilename");
                  return; // Exit early if we've initiated the download
              } catch (error) {
                  console.error("Error during blob access download:", error);
                  // Continue to fallback mechanisms
              }
          }
          
          // If we have a stored blob URL in sessionStorage, try using that
          const storedBlobUrl = sessionStorage.getItem('resumeBlobUrl');
          if (storedBlobUrl) {
              console.log("Using stored blob URL from sessionStorage:", storedBlobUrl);
              
              try {
                  // Create temporary link element for download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = storedBlobUrl;
                  downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
                  
                  setResult('Downloading your resume...');
                  
                  // Append to the document, click it, and remove it
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  console.log("Download initiated from stored blob URL");
                  return; // Exit early if we've initiated the download
              } catch (error) {
                  console.error("Error downloading from stored blob URL:", error);
                  // Continue to fallback mechanisms
              }
          }
          
          // If we have a resumeFile as fallback, use it
          if (resumeFile) {
              console.log("No optimized PDF found in any storage location, using local file fallback");
              downloadLocalFile(event);
              return;
          }
          
          // If we get here, we couldn't find any way to download the resume
          console.log("No resume found in any storage location");
          setResult('No resume available for download. Please upload a resume first.');
          
          // Direct user to upload a new resume
          setTimeout(() => {
              opencard2(); // Open the upload card if it exists
          }, 2000);
      } else {
          // No resumeData.title
          console.log("No resumeData or resumeData.title found");
          setResult('No resume available for download. Please create a resume first.');
          
          // Suggest creating a new resume after a delay
          setTimeout(() => {
              openCard1(); // Open the create resume dialog
          }, 1500);
      }
  };
  
  // Helper function to download local file - Now requires a user-initiated event
  const downloadLocalFile = (event) => {
      if (!event || !event.isTrusted) {
          console.log("Download not triggered by user action, aborting");
          setResult('Please use the download button on the homepage to download your resume.');
          return;
      }
      
      logStorageState("In downloadLocalFile");
      console.log("User initiated download of locally stored resume file");
      
      if (!resumeFile) {
          console.error("downloadLocalFile called but resumeFile is null or undefined");
          // Try to use the stored blob URL as a last resort
          const storedBlobUrl = sessionStorage.getItem('resumeBlobUrl');
          if (storedBlobUrl) {
              console.log("No resumeFile, but found stored blob URL. Using that instead.");
              try {
                  const sanitizedJobTitle = resumeData && resumeData.title ? 
                      resumeData.title.replace(/\s+/g, '_').toLowerCase() :
                      "resume";
                      
                  const downloadLink = document.createElement('a');
                  downloadLink.href = storedBlobUrl;
                  downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  setResult('Your resume is being downloaded...');
                  return;
              } catch (error) {
                  console.error("Error using stored blob URL:", error);
              }
          }
          
          setResult('No file available for download. Please upload a resume first.');
          return;
      }
      
      if (!resumeData || !resumeData.title) {
          console.error("downloadLocalFile called but resumeData or resumeData.title is missing");
          // Use a default title if missing
          const defaultTitle = "resume_" + new Date().toISOString().slice(0, 10).replace(/-/g, '');
          console.log("Using default title:", defaultTitle);
          
          try {
              const fileURL = URL.createObjectURL(resumeFile);
              const downloadLink = document.createElement('a');
              downloadLink.href = fileURL;
              downloadLink.download = `${defaultTitle}.pdf`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(fileURL), 100);
              setResult('File downloaded with default name.');
          } catch (error) {
              console.error("Error in downloadLocalFile with default title:", error);
              setResult('Error downloading file. Please try again.');
          }
          return;
      }
      
      const sanitizedJobTitle = resumeData.title.replace(/\s+/g, '_').toLowerCase();
      
      try {
          const fileURL = URL.createObjectURL(resumeFile);
          
          // Log file details
          console.log("Creating object URL for file:", {
              name: resumeFile.name,
              size: resumeFile.size,
              type: resumeFile.type,
              objectURL: fileURL
          });
          
          // Create temporary link element for download
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
          
          // Append to the document, click it, and remove it
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Revoke the URL to free up memory
          setTimeout(() => URL.revokeObjectURL(fileURL), 100);
          
          // Don't clear resumeFile - keep it for future downloads
          // Store it in sessionStorage as a blob URL for backup
          const backupBlobUrl = URL.createObjectURL(resumeFile);
          sessionStorage.setItem('resumeBlobUrl', backupBlobUrl);
          console.log("Stored backup blob URL:", backupBlobUrl);
          
          // Show a less intrusive download message
          setResult('Your resume is being downloaded...');
      } catch (error) {
          console.error("Error in downloadLocalFile:", error);
          setResult('Error downloading file. Please try again.');
      }
  };
  
  // Helper function to download original file when needed - Now requires a user-initiated event
  const downloadOriginalFile = (event) => {
      if (!event || !event.isTrusted) {
          console.log("Download not triggered by user action, aborting");
          setResult('Please use the download button on the homepage to download your resume.');
          return;
      }
      
      console.log("User initiated download of original file as fallback");
      
      if (!resumeFile) {
          console.warn("No original file available for download");
          setResult('No original file available. Please create a new resume.');
          return;
      }
      
      const sanitizedJobTitle = jobTitle.replace(/\s+/g, '_').toLowerCase();
      const fileURL = URL.createObjectURL(resumeFile);
      
      // Create temporary link element
      const downloadLink = document.createElement('a');
      downloadLink.href = fileURL;
      downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show a download message
      setResult('Your original resume is being downloaded...');
      
      // Revoke the URL to free up memory
      setTimeout(() => {
          URL.revokeObjectURL(fileURL);
      }, 2000);
  };
  
  // Helper function to fall back to original file in error cases - Now requires a user-initiated event
  const fallbackToOriginalFile = (event) => {
      if (!event || !event.isTrusted) {
          console.log("Download not triggered by user action, aborting");
          setResult('Please use the download button on the homepage to download your resume.');
          return;
      }
      
      logStorageState("In fallbackToOriginalFile");
      console.log("User initiated fallback to original file after error");
      
      if (!resumeFile) {
          console.warn("No original file available for fallback");
          setResult('Error occurred, but no original file is available. Please try again.');
          return;
      }
      
      try {
          const sanitizedJobTitle = jobTitle ? jobTitle.replace(/\s+/g, '_').toLowerCase() : 
                              resumeFile.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_').toLowerCase();
                              
          console.log("Creating object URL for fallback file:", {
              name: resumeFile.name,
              size: resumeFile.size, 
              type: resumeFile.type,
              sanitizedJobTitle
          });
          
          const fileURL = URL.createObjectURL(resumeFile);
          
          // Create temporary link element
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `${sanitizedJobTitle}_resume.pdf`;
          
          // Append to the document, click it, and remove it
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Revoke the URL to free up memory
          setTimeout(() => URL.revokeObjectURL(fileURL), 100);
          
          // Show success message
          setResult('Your original file is being downloaded as a fallback.');
      } catch (error) {
          console.error("Error in fallbackToOriginalFile:", error);
          setResult('Error downloading original file. Please try again.');
      }
  };

  {/*Navigation to Interview Page*/}
  const goToInterview = ()=> {
    navigate('/warmup');
  }

  const [filename, setFilename] = useState("Uplode File");

  {/*Selected Resumes - Resume Builder*/}
  const [selectedFile, setSelectedFile] = useState(null);
  const handleFileChange = (event) => {
    // Check if files exist and if the first file exists
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setFilename(event.target.files[0].name);
      console.log("Selected file:", event.target.files[0]);
    } else {
      console.log("No file selected");
    }
  };

  {/*save Details for specific company Interview - Interview AI*/}
  const [specficCompanyResume,setSpecficCompanyResume ] = useState(null);
  const holdFile = (event) => {
    setSpecficCompanyResume(event.target.files[0]);
    console.log("Selected file:", event.target.files[0]);
    setIFilename(event.target.files[0].name);
  };



  {/*User details for specific company interview - Interview AI*/}
  const [Ifilename, setIFilename] = useState("Uplode File");
  const [name,setName ] = useState(null);
  const [role,setRole ] = useState(null);
  const [company,setCompany ] = useState(null);
  const [description,setDescription ] = useState(null);
  console.log('Name:',name)
  console.log('role',role)
  console.log('company',company)
  console.log('description',description)
  console.log('Resume',specficCompanyResume)



  /* function call at navigation to interview
  const handleSubmit = async () => {
    
    const formData = new FormData();
    formData.append("role", role);
    formData.append("company", company);
    formData.append("description", description);
    if (specficCompanyResume) formData.append("specficCompanyResume", specficCompanyResume);
    const response = await fetch("http://localhost:8000/submit-interview/", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();
    console.log(data);
  };
  */



  const [mode,setMode ] = useState(null);
  const [experience,setExperience ] = useState(null);
  const [category,setCategory ] = useState(null);
  const [duriation,setDuriation ] = useState(null);

  console.log('Mode:',mode)
  console.log('experience',experience)
  console.log('Category',category)
  console.log('Duriation',duriation)


  {/*card1 styles and function Started here*/}
    const [cardStyle,setCardStyle] = useState({
      display:"none",
      backgroundColor:"#FAFBFE",
      position:"absolute",
      transition:"0.5s ease in",
      zIndex: 1,
    })

    

    const openCard1 = () => {
      setCardStyle(prevState => ({
        ...prevState,            
        display: "block"       
      }));
        document.getElementById("overlay").style.display = "block";
    }

  {/*Overlay when clicked on any option*/}
    const overLay = {
      display: "none", 
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.80)", // Dark overlay effect
      zIndex: 1,
      backdropFilter:"blur(0.5px)"
    };

    const closeCard1 = () => {
      setCardStyle(prevState => ({
        ...prevState,            
        display: "none"       
      }));
        document.getElementById("overlay").style.display = "none";
    }
  {/*card1 styles and function Ended here*/}


  {/*card2 (taking info from user) styles and function Started here*/}
    const [card2Style,setCard2Style] = useState({
      display:"none",
      backgroundColor:"#FAFBFE",
      position:"absolute",
      backgroundColor:"#FAFBFE",
      transition:"0.5s ease in",
      zIndex: 1,
    })

    const opencard2 = () => {
      closeCard1();
      setCard2Style(prevState => ({
        ...prevState,
        display:"block"
      }))
      document.getElementById("overlay").style.display = "block";
    }

    const closeCard2 = () => {
      setCard2Style(prevState => ({
        ...prevState,
        display:"none"
      }))
    }

    const goBack = () => {
      closeCard2();
      setCardStyle(prevState => ({
        ...prevState,            
        display: "block"       
      }));
        document.getElementById("overlay").style.display = "block";
    }



   {/*card3 (Taking mobile number from user) styles and function Started here*/}
    const [askNumber,setAskNumber] = useState({
      display:"none",
      backgroundColor:"#FAFBFE",
      position:"absolute",
      backgroundColor:"#FAFBFE",
      transition:"0.5s ease in",
      zIndex: 1,
    })

    const openCard3 = () => {
      setCard2Style(prevState => ({
        ...prevState,            
        display: "none"       
      }));
      document.getElementById("overlay").style.display = "none";
      setAskNumber(prevState => ({
        ...prevState,            
        display: "block"       
      }));
      document.getElementById("overlay").style.display = "block";
    }

    const closecard3 = () => {
      setAskNumber(prevState => ({
        ...prevState,            
        display: "none"       
      }));
      setCard2Style(prevState => ({
        ...prevState,
        display:"block"
      }))
      document.getElementById("overlay").style.display = "block";
    }

    const [nameMobile, setNameMobile] = useState("");
  const [mobile, setMobile] = useState("");

  const handleMobileSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: nameMobile, // Match the backend's expected field name
      mobile: mobile,   // Keep this as is
    };

    try {
      const response = await fetch("http://localhost:8009/update_user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Convert payload to JSON string
      });

      const data = await response.json();

      if (response.ok) {
        // Reset the form fields
        setNameMobile(""); // Clear the name field
        setMobile("");     // Clear the mobile field

        // Open the homepage or perform other actions
        navigate('/homePage');
        setAskNumber(prevState => ({
          ...prevState,            
          display: "none"       
        }));
        document.getElementById("overlay").style.display = "none";
      } else {
        alert(data.detail || "An error occurred");
      }
    } catch (error) {
      alert("Failed to submit data. Please check your connection.");
      console.error("Error:", error);
    }
  };
   

  const openHomepage = ()=> {
    setAskNumber(prevState => ({
      ...prevState,            
      display: "none"       
    }));
    document.getElementById("overlay").style.display = "none";
  }

  const [feedStyle,setfeedStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    backgroundColor:"#FAFBFE",
    transition:"0.5s ease in",
    zIndex: 1,
  })
  



const [isfeedback,setIsfeedback] = useState(false);
  const openFeedback = ()=> {
   setIsfeedback(prev=> !prev)
    setfeedStyle(prevState=> ({
      ...prevState,
         display: prevState.display == 'block'?'none':'block',
    }))
    if(isfeedback === false) {
      document.getElementById("overlay").style.display = "block";
      
    }
    else {
      document.getElementById("overlay").style.display = "none";
      
    }
  }

{/*Interview Coach (Options)*/}

  const [intervieOptionsStyle,setInterviewOptionsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
  })

  const openinterviewAiOptions = ()=> {
    setInterviewOptionsStyle(prevState=> ({
      ...prevState,
      display:"block",
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const closeInterviewAIOptions = () => {
    setInterviewOptionsStyle(prevState=> ({
      ...prevState,
      display:"none",
    }))
    document.getElementById("overlay").style.display = "none";
  }

   const [specificDetailsStyle,setSpecificDetailsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
   })

   const openSpecificDetails = () => {
    closeInterviewAIOptions();
    setSpecificDetailsStyle(prevState=> ({
      ...prevState,
      display:"block",
    }))
    document.getElementById("overlay").style.display = "block";
   }
  
   const closeInterviewAIDetails = () => {
    setSpecificDetailsStyle(prevState=> ({
      ...prevState,
      display:'none'
    }))
    openinterviewAiOptions();
   }

   const [moreDetailsStyle,setMoreDetailsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
   })

const openMoreDetails = async () => {
  /*const formData = new FormData();
  formData.append("role", role);
  formData.append("company", company);
  formData.append("description", description);
  if (specficCompanyResume) formData.append("specficCompanyResume", specficCompanyResume);
  const response = await fetch("http://localhost:8000/submit-interview/", {
      method: "POST",
      body: formData,
  });

  const data = await response.json();
  console.log(data);*/
  setSpecificDetailsStyle(prevState=> ({
    ...prevState,
    display:'none'
  }))
  setMoreDetailsStyle(prevState=> ({
    ...prevState,
    display:'block',
  }))
  document.getElementById("overlay").style.display = "block";
}

  const [active1, setActive1] = useState('');
  const handleClick1 = (name) => {
    setActive1(name);
    setMode(name)
  };

  const [active2, setActive2] = useState('');
  const handleClick2 = (name) => {
    setActive2(name);
    setExperience(name)
  };

  const [active3, setActive3] = useState('');
  const handleClick3 = (name) => {
    setActive3(name);
    setCategory(name)
  };

  const [active4, setActive4] = useState('');
  const handleClick4 = (name) => {
    setActive4(name);
    setDuriation(name)
  };

  const closeMoreDetails = () => {
    openSpecificDetails();
    setMoreDetailsStyle(prevState=> ({
      ...prevState,
      display:'none',
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const [response, setResponse] = useState(null);
  const [errors, setErrors] = useState(null);

  const handleInterviewSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);

      try {
          const response = await fetch("http://127.0.0.1:8000/submit-interview/", {
              method: "POST",
              body: formData
          });

          const result = await response.json();
          setResponse(result);
          setError(null);
      } catch (error) {
          setError(error.message);
          setResponse(null);
      }
  };
   

  // Check for query parameter to open resume form
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const openResumeForm = queryParams.get('openResumeForm');
    
    if (openResumeForm === 'true') {
      // Open the resume creation form
      opencard2();
      
      // Clear the query parameter from the URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  const [isButton,isSetButton] = useState(false)

  // Add a useEffect to try to extract the PDF filename from resumeData if available
  useEffect(() => {
    // Try to recover PDF filename from other sources if not already in localStorage
    if (!localStorage.getItem('optimizedPdfFilename') && resumeData) {
      if (resumeData.pdf_file_name) {
        localStorage.setItem('optimizedPdfFilename', resumeData.pdf_file_name);
        console.log("Recovered PDF filename from resumeData:", resumeData.pdf_file_name);
      } else if (resumeData.filename && resumeData.filename.includes('resume_')) {
        localStorage.setItem('optimizedPdfFilename', resumeData.filename);
        console.log("Recovered PDF filename from resumeData.filename:", resumeData.filename);
      }
    }
  }, [resumeData]);

  // When setting resumeData, also ensure we store PDF filename if available
  const updateResumeData = (data) => {
    setResumeData(data);
    
    // If data has PDF filename, store it for later use
    if (data && data.pdf_file_name) {
      localStorage.setItem('optimizedPdfFilename', data.pdf_file_name);
      console.log("Stored PDF filename from updateResumeData:", data.pdf_file_name);
    }
  };

  return (
    <div className='dashboard'>
      {/* Add loading overlay for full-screen loading effect */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h3>Optimizing Your Resume</h3>
            <p>We're tailoring your resume for maximum impact. This may take up to a minute...</p>
            <div className="progress-status">
              <p className="loading-status">{result}</p>
            </div>
          </div>
        </div>
      )}

      <div className='greet'>
        <div className='greet-content'>
        <img src={props.topImage}/>
        <div>
        <h2>{props.heading}</h2>
        <p>{props.caption}</p>
        </div>
        </div>
        {isButton ? <div className='top-create-button'>
        <button onClick={openCard1}>+ Create resume</button>
        </div> : null}
        
      </div>
      



      {props.resumeBuilderShow && <div className='content'>
        <img src={illustration}/>
        <p>Create a professional, standout resume tailored to <br/> your dream job with Job Spring!</p>
        <button onClick={openCard1}><a>Create New resume</a></button>
      </div>}
      <div id='overlay' style={overLay}>

        {/* Options Card*/}
      <div className='options' style={cardStyle}>
        <div className='header'>
          <h3>Create New Resume</h3>
          <img  className='close-btn' onClick={closeCard1} src={cancel_img}/>
        </div>
        <div className='cardContent'>
          <h3>How do you want to get started?</h3>
          <div className='twoOptions'>
            <div className='option' onClick={opencard2}>
              <img src={upload_img}/>
              <h3>Select a resume</h3>
              <p>Select from the existing library or upload a new file</p>
            </div>
            <div className=' disabledstate'>
              <img src={scratchFile_img}/>
              <h3>Start From Scratch</h3>
              <p>Build your resume using our resume builder</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Create New Resume Card*/}
        <div className='createNewResume' style={card2Style}>
         <div className='header2'>
         <img onClick={goBack} src={back_img}/>
         <h3>Create New Resume</h3>
         </div>
         
         <form onSubmit={handleSubmit} id="resumeForm" encType="multipart/form-data">
    <div className="fileSelect">
      <div className='fileDetails'>
        <p>Select file</p>
        <label className="upload-btn">
        {filename.slice(0,11) +'..'} <img src={uploadResume_img} alt="Upload" />
            <input
            className='fileInput' 
                type="file" 
                style={{ display: "none" }} 
                onChange={handleFileChange} 
                id="file" 
                name="file"  // ✅ Ensure name="file" matches backend
                accept=".pdf,.docx" 
                required 
            />
        </label>
        </div>
       
    </div>
    <div className="inputs">
        <label htmlFor='title'>Job title</label>
        <input id="title" name="title" type="text" placeholder="title" required />
        <label htmlFor='description'>Description</label>
        <textarea id="description" name="description" placeholder="description" required />
        <button className="submitBtn" type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="loading-animation">
              <div className="spinner"></div>
              <span>Optimizing your resume. This may take a minute...</span>
            </div>
          ) : (
            "Optimize Resume"
          )}
        </button>
        {error && <div className="error-message">{error}</div>}
    </div>
</form>

        </div>


        {/* Taking moblile number from user Card*/}
      <div className='askMblNumber' style={askNumber}>
        <div className='header3'>
          <img onClick={closecard3} className='close-btn' src={cancel_img} alt=''/>
        </div>
        <div className='detail-form'>
          <div>
          <h3>provide Your Phone Number</h3>
          <p>Enter your phone number to create and download your resume for free</p>
          </div>
          <form onSubmit={handleMobileSubmit} id="userForm">
    <label htmlFor="nameMobile">Enter Your Name</label>
    <input
      type="text"
      name="nameMobile"
      id="nameMobile"
      required
      placeholder="Enter Name"
      onChange={(e) => setNameMobile(e.target.value)}
    />

    <label htmlFor="mobile">Enter mobile number</label>
    <input
      type="text"
      required
      placeholder="Enter here"
      id="mobile"
      name="mobile"
      onChange={(e) => setMobile(e.target.value)}
    />

    <p>
      <img src={rightTick_img} alt="Checkmark" /> We'll use your number to deliver your resume and updates.
    </p>

    <button className="submit-Btn" type="submit">Submit</button>
  </form>
        </div>
      </div>

      {/* feedback portion*/}
      <div className='feedback' style={feedStyle}>
        <div className='feed-header'>
          <div>-
            <button><img className='feed-img' src={feed_img}/></button>
            <h6>Feedback</h6>
          </div>
          <div>
            <img onClick={openFeedback} className='feed-cancel' src={cancel_img}/>
          </div>
        </div>
        <div className='feed-content'>
          <div className='feed-top'>
            <h3>Rate Your Experience</h3>
            <p>Your input is valuable in helping us better understand your needs and tailor our service accordingly.</p>
          </div>
          <div className='feed-mid'>
            <div className='rating-stars'>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
            </div>
          </div>
          <div className='feed-bottom'>
          <p>Got suggestions? we'd love to hear them!</p>
            <textarea placeholder='Write here'></textarea>
            <button>Submit now</button>
          </div>
        </div>
      </div>

      {/* Home page portion*/}
      {props.homePage && <div className='home-page'>
        <h3>Your Optimized Resumes</h3>
        <div className='container'>
          {resumeData ? (
            <div className='Process-card ready'>
              <div className='card-top'>
                <div>
                  <img src={card1_img} />
                  <h3>{resumeData.title.length > 12 ? resumeData.title.slice(0,12) + '..' : resumeData.title}</h3>
                  <button className='ready-btn'>
                    <h6>Ready</h6>
                  </button>
                </div>
                <div>
                  {resumeData.date}
                </div>
              </div>
              <div className='card-bottom'>
                <img src={share_img}/>
                <button 
                  className='ready-download' 
                  onClick={handleDownload}
                >
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className='Process-card'>
              <div className='card-top'>
                <div>
                  <img src={card1_img} />
                  <h3>No Resume</h3>
                  <button>
                    <p></p>
                    <h6>Create One</h6>
                  </button>
                </div>
                <div>
                  Create a resume to get started
                </div>
              </div>
              <div className='card-bottom'>
                <img src={share_img}/>
                <button onClick={openCard1}>Create</button>
              </div>
            </div>
          )}
        </div>
      </div>}

      {props.homePage && (
        <div className="resume-dashboard-container">
          
        </div>
      )}

      
      {props.homePageUpdated && <div className='home-page'>
        <h3>Your Interviews</h3>
        <div className='container'>
     
          <div className='Process-card ready'>
            <div className='card-top'>
              <div>
              <img src={props.topImage} />
              <h3>UX Designer</h3>
              <h6>jan 12,2025</h6>
              </div>
              <div>
                Google
              </div>
            </div>
            <div className='card-bottom'>
              <img src={share_img}/>
              <button className='ready-download'>Download</button>
            </div>
          </div>

          
        </div>
      </div>}


      

{/* InterView Updated AI */}
{props.interviewAIUpdatedShow && 
  <div className='interviewAI-content'>
  <img src={interview_illustration}/>
  <p>Start your journey with AI-driven interviews <br/> and feedback to boost your confidence.</p>
  <button /*onClick={openinterviewAiOptions}*/><a>Comming soon</a></button>
</div>

}

{/* InterView AI Options */}
<div className='interview-options' style={intervieOptionsStyle}>
        <div className='header'>
          <h3>Practice with interview ai</h3>
          <img onClick={closeInterviewAIOptions} src={cancel_img}/>
        </div>
        <div className='cardContent'>
          <h3>How do you want to get started?</h3>
          <div className='twoOptions'>
            <div className='option' onClick={openCard1}>
              <img src={generalInterview_img}/>
              <h3>General interview</h3>
              <p>Practice interviews for hands-on experience.</p>
            </div>
            <div className='option' onClick={openSpecificDetails}>
              <img src={specificInterview_img}/>
              <h3>Interview for specific companies</h3>
              <p>Practice for specific companies using details</p>
            </div>
          </div>
        </div>
      </div>


      {/* InterView AI specific Details */}
      <div className='specificInterview' style={specificDetailsStyle}>
        <div className='specDetails-header'>
          <h5>Interview Details</h5>
          <img onClick={closeInterviewAIDetails} src={cancel_img}/>
        </div>
        <form className='specDetailsForm'>
          <div>
          
            <div className='inputs top-input'>
            <label>Enter your name </label>
            <input placeholder='name' type='text' onChange={(event)=> setName(event.target.value)}></input>
            </div>
            <div className='selectFile'>
              <p>Select file</p>
              <label className="upload-btn specDetails" style={{color:'white'}}>
              {Ifilename.slice(0,12)+'..'} <img src={uploadResume_img} />
               <input type="file" style={{ display: "none" }} onChange={holdFile} />
              </label>
            </div>
          </div>
          <label htmlFor='role'>Enter your role </label>
            <select id='role' name='role' placeholder='role' onChange={(event)=> setRole(event.target.value)}>
              <option value='Web Developer'>Web Developer</option>
              <option value='Web Developer'>ML Developer</option>
              <option value='Web Developer'>UX Designer</option>
              <option value='Web Developer'>Data analytics</option>
              <option value='Web Developer'>Cyber Security</option>
            </select>
            
            <label htmlFor='company'>Company name </label>
            <select id='company' name='role' placeholder='company' onChange={(event)=> setCompany(event.target.value)}>
              <option value='Google'>Google</option>
              <option value='Facebook'>Facebook</option>
              <option value='Amazon'>Amazon</option>
              <option value='Nvidia'>Nvidia</option>
              <option value='Microsoft'>Microsoft</option>
            </select>

            <label>Description</label>
            <textarea placeholder='description' onChange={(event)=> setDescription(event.target.value)}></textarea>
            <button type='submit' onClick={openMoreDetails}>Next</button>
        </form>
        
      </div>
      



      {/* More Details */}
      <div className="more-details" style={moreDetailsStyle}>
      <div className="moreDetails-header">
        <img onClick={closeMoreDetails} src={back_img} alt="Back" />
        <p>Interview Details</p>
      </div>
      <div className="details-buttons">
        <div className="buttons-section">
          <p>Select mode</p>
          <div>
            <button onClick={() => handleClick1('Easy')} className={active1 === 'Easy' ? 'active' : ''} onChange={()=> setMode('Easy')} >Easy</button>
            <button onClick={() => handleClick1('Moderate')} className={active1 === 'Moderate' ? 'active' : ''} onChange={()=> setMode('Moderate')}>Moderate</button>
            <button onClick={() => handleClick1('Hard')} className={active1 === 'Hard' ? 'active' : ''}  onChange={()=> setMode('hard')}>Hard</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Work experience</p>
          <div>
            <button onClick={() => handleClick2('Fresher')} className={active2 === 'Fresher' ? 'active' : ''} onChange={()=> setExperience('Fresher')}>Fresher</button>
            <button onClick={() => handleClick2('Mid-level')} className='disabled'>Mid-level</button>
            <button onClick={() => handleClick2('Senior-level')} className='disabled'>Senior-level</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Select category</p>
          <div>
            <button onClick={() => handleClick3('Job')} className={active3 === 'Job' ? 'active' : ''} onChange={()=> setCategory('Job')} >Job</button>
            <button onClick={() => handleClick3('Internship')} className={active3 === 'Internship' ? 'active' : ''}  onChange={()=> setCategory('Internship')}>Internship</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Interview Duration</p>
          <div>
            <button onClick={() => handleClick4('5 mins')} className={active4 === '5 mins' ? 'active' : ''} onChange={()=> setDuriation('5 min')}>3 mins</button>
            <button onClick={() => handleClick4('15 mins')} className={active4 === '15 mins' ? 'active disabled' : 'disabled'}  onChange={()=> setDuriation('15 min')}>15 mins</button>
            <button onClick={() => handleClick4('25 mins')} className={active4 === '25 mins' ? 'active disabled' : 'disabled' } onChange={()=> setDuriation('25 min')}>25 mins</button>
          </div>
        </div>
        <div className="start-button">
          <button onClick={goToInterview}>Start interview</button>
        </div>
      </div>
    </div>






      {/* Coming Soon */}
      {props.AutoApplyShow && 
  <div className='coming-soon'>
    <img src={comingSoon_img} />
    <h3>Coming soon!</h3>
    <p>Auto-apply to every job effortlessly.<br/>
    Stay tuned for this amazing feature.</p>
    <button><img src={notification_img}/>Notify Me</button>
  </div>
}

      <div className='helpMe-btn'>
        <button onClick={openFeedback} className='feedback-btn'><img id='feedback-img' src = {isfeedback?cancelfeed_img:helpme_img}/></button>
      </div>
    </div>
  )

}
export default Dashboard
