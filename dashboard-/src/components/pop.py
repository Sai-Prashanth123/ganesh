from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
import openai
import PyPDF2
import docx
from io import BytesIO
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI API Credentials (Stored securely using environment variables)
openai.api_key = os.getenv("OPENAI_API_KEY", "EhPy4EaDt6osKIvuJzaa4XfQVoWUzNkho4TWgp4unEBWlMNqVfqOJQQJ99BBAC77bzfXJ3w3AAABACOGbr3H")
openai.api_base = os.getenv("OPENAI_API_BASE", "https://betaaijob.openai.azure.com/")
openai.api_type = "azure"
openai.api_version = "2023-03-15-preview"
deployment_name = os.getenv("DEPLOYMENT_NAME", "gpt-35-turbo")

# FastAPI App Initialization
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Mode(str, Enum):
    EASY = "Easy"
    MODERATE = "Moderate"
    HARD = "Hard"

class Experience(str, Enum):
    FRESHER = "Fresher"
    MID_LEVEL = "Mid-level"
    SENIOR = "Senior level"

class Category(str, Enum):
    JOB = "Job"
    INTERNSHIP = "Internship"

@app.get("/api/options")
async def get_options():
    return {
        "modes": [mode.value for mode in Mode],
        "experience_levels": [exp.value for exp in Experience],
        "categories": [cat.value for cat in Category]
    }

async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        file.file.seek(0)  # Reset file pointer
        reader = PyPDF2.PdfReader(file.file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip() if text else "No text extracted from PDF."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")

async def extract_text_from_docx(file: UploadFile) -> str:
    try:
        file_content = await file.read()
        doc = docx.Document(BytesIO(file_content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip() if text else "No text extracted from DOCX."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing DOCX file: {str(e)}")

async def extract_resume_text(resume: UploadFile) -> str:
    if resume.filename.endswith(".pdf"):
        return await extract_text_from_pdf(resume)
    elif resume.filename.endswith(".docx"):
        return await extract_text_from_docx(resume)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF and DOCX are allowed.")

async def structure_resume_text(text: str) -> dict:
    try:
        response = await asyncio.to_thread(openai.ChatCompletion.create,
            deployment_id=deployment_name,  # Required for Azure OpenAI
            messages=[
                {"role": "system", "content": """
Objective:
Convert an unstructured resume into a structured text format while maintaining data integrity, context, and chronological progression. Extract key details dynamically and present them in an organized, readable, and machine-friendly format.

Core Sections to Extract & Format:
Personal Details:
- Full Name
- Location (City, State, Country)
- Contact Number
- Email Address

Professional Summary:
- Brief overview of professional background

Career Objective:
- Aspirations, goals, and career path

Education:
- Higher Education (Bachelor’s, Master’s, etc.)
  * Degree Name
  * Major/Field of Study
  * Institution Name
  * Graduation Year
  * Key Achievements (if any)
- Secondary Education (High School/12th Grade, if present)
  * School Name
  * Board/Curriculum (CBSE, ICSE, State Board, etc.)
  * Location
  * Graduation Year
  * Academic Stream (Science/Commerce/Arts)
  * Percentage/Grade

Work Experience:
For Each Job Role:
- Job Title
- Company Name
- Employment Type (Full-Time, Remote, Internship, etc.)
- Location (or mention Remote)
- Start Date – End Date (or Present if ongoing)
- Responsibilities & Key Contributions (with quantifiable metrics)

Skills Categorization:
- Primary Skills: (Core expertise – Programming, AI, Cloud, etc.)
- Secondary Skills: (Frameworks, Automation, Soft Skills, etc.)
- Proficiency Levels (if available): Basic, Intermediate, Advanced

Achievements & Projects:
For Each Project or Achievement:
- Title
- Description
- Impact (e.g., percentage improvements, awards, real-world applications)
             
Certifications:
- Certification Name
- Issuing Organization
- Issue Date
- Expiry Date (if applicable)
                """},
                {"role": "user", "content": text}
            ],
            max_tokens=1000
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume text: {str(e)}")

interview_data = {}
@app.post("/submit-interview/")
async def submit_interview(
    role: str = Form(...),
    company: str = Form(...),
    description: str = Form(...),
    resume: UploadFile = File(...)
):
    resume_text = await extract_resume_text(resume)
    structured_resume = await structure_resume_text(resume_text)

    
    interview_data["data"]= {
        "interview_instructions": (
           "ask the interview based on the resume details"
        ),
        "resume_details": structured_resume,
        "description": description,
        "role": role,
        "company": company
    }
    return interview_data

@app.get("/api/get-interview-details")
async def get_interview_details():
    if not interview_data:
        raise HTTPException(status_code=404, detail="No interview details found.")
    return interview_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
