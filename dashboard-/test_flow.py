import requests
import os
import time
import logging
import io
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL for the API
BASE_URL = "http://localhost:8000"

def download_sample_pdf():
    """Download the sample PDF from the create-sample-pdf endpoint"""
    try:
        logger.info("Downloading sample PDF from create-sample-pdf endpoint...")
        response = requests.get(f"{BASE_URL}/create-sample-pdf")
        
        if response.status_code == 200:
            response_json = response.json()
            logger.info(f"Response: {response_json}")
            
            if "blob_url" in response_json:
                blob_url = response_json["blob_url"]
                logger.info(f"Downloading sample PDF from URL: {blob_url}")
                
                # Download the PDF
                pdf_response = requests.get(blob_url)
                if pdf_response.status_code == 200:
                    sample_pdf_path = "sample_resume.pdf"
                    with open(sample_pdf_path, "wb") as f:
                        f.write(pdf_response.content)
                    logger.info(f"Sample PDF downloaded and saved to {sample_pdf_path}")
                    return sample_pdf_path
                else:
                    logger.error(f"Failed to download sample PDF. Status code: {pdf_response.status_code}")
            else:
                logger.error("No blob_url in response")
        else:
            logger.error(f"create-sample-pdf endpoint test failed with status code {response.status_code}")
            logger.error(f"Error message: {response.text}")
        
        return None
    except Exception as e:
        logger.error(f"Error downloading sample PDF: {str(e)}")
        return None

def test_process_all_endpoint(sample_pdf_path=None):
    """Test the process-all endpoint with a sample resume and job details"""
    # Sample job details
    job_title = "Software Engineer"
    job_description = """
    We are looking for a Software Engineer with experience in Python, FastAPI, and Azure.
    The role involves developing cloud-based solutions and working with data processing pipelines.
    Requirements:
    - 3+ years of Python development
    - Experience with FastAPI or similar frameworks
    - Knowledge of Azure services, especially Cosmos DB and Blob Storage
    - Good communication skills
    """
    
    # Find a sample PDF file for testing
    if not sample_pdf_path:
        sample_files = list(Path('.').glob('**/*.pdf'))
        if not sample_files:
            logger.error("No sample PDF files found for testing")
            return False
            
        sample_file_path = sample_files[0]
    else:
        sample_file_path = sample_pdf_path
        
    logger.info(f"Using sample file: {sample_file_path}")
    
    try:
        # Prepare the files and form data
        files = {
            'file': (os.path.basename(sample_file_path), open(sample_file_path, 'rb'), 'application/pdf')
        }
        
        form_data = {
            'title': job_title,
            'description': job_description
        }
        
        # Make the request
        logger.info("Testing process-all endpoint...")
        response = requests.post(
            f"{BASE_URL}/process-all/",
            files=files,
            data=form_data
        )
        
        # Check the response
        if response.status_code == 200:
            logger.info("process-all endpoint test successful")
            response_json = response.json()
            logger.info(f"Response: {response_json}")
            
            # Store IDs for further testing
            resume_id = response_json.get('resume_id')
            job_id = response_json.get('job_id')
            tailored_resume_id = response_json.get('tailored_resume_id')
            pdf_file_name = response_json.get('pdf_file_name')
            
            return {
                'resume_id': resume_id,
                'job_id': job_id,
                'tailored_resume_id': tailored_resume_id,
                'pdf_file_name': pdf_file_name
            }
        else:
            logger.error(f"process-all endpoint test failed with status code {response.status_code}")
            logger.error(f"Error message: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error testing process-all endpoint: {str(e)}")
        return False
    finally:
        # Close the file
        files['file'][1].close()

def test_download_resume(resume_id, user_id="test_user"):
    """Test downloading a resume by ID"""
    try:
        logger.info(f"Testing download-resume endpoint for resume_id: {resume_id}...")
        response = requests.get(
            f"{BASE_URL}/download-resume/{resume_id}?user_id={user_id}",
            stream=True
        )
        
        if response.status_code == 200:
            # Save the downloaded file
            download_path = f"downloaded_resume_{resume_id}.pdf"
            with open(download_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Resume downloaded successfully and saved to {download_path}")
            return True
        else:
            logger.error(f"download-resume endpoint test failed with status code {response.status_code}")
            logger.error(f"Error message: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error testing download-resume endpoint: {str(e)}")
        return False

def main():
    """Run all tests"""
    logger.info("Starting end-to-end flow testing")
    
    # Download the sample PDF first
    sample_pdf_path = download_sample_pdf()
    
    if not sample_pdf_path:
        logger.error("Failed to download sample PDF. Will attempt to find a local PDF file.")
    
    # Allow some time for the backend processing
    logger.info("Waiting for 5 seconds...")
    time.sleep(5)
    
    # Test the main process-all endpoint
    process_result = test_process_all_endpoint(sample_pdf_path)
    
    if process_result:
        # Allow some time for the backend processing
        logger.info("Waiting for 5 seconds...")
        time.sleep(5)
        
        # Test downloading the resume
        resume_id = process_result.get('resume_id')
        download_result = test_download_resume(resume_id)
        
        if download_result:
            logger.info("All tests completed successfully!")
        else:
            logger.error("Download test failed")
    else:
        logger.error("Processing test failed")

if __name__ == "__main__":
    main() 