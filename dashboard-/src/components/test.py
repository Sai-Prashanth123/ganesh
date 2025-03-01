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

openai.api_key = os.getenv("OPENAI_API_KEY", "EhPy4EaDt6osKIvuJzaa4XfQVoWUzNkho4TWgp4unEBWlMNqVfqOJQQJ99BBAC77bzfXJ3w3AAABACOGbr3H")
openai.api_base = os.getenv("OPENAI_API_BASE", "https://betaaijob.openai.azure.com/")
openai.api_type = "azure"
openai.api_version = "2023-03-15-preview"
deployment_name = os.getenv("DEPLOYMENT_NAME", "gpt-35-turbo")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store processed data in memory (for simplicity)
processed_data_store = {}

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
        file.file.seek(0)
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
            deployment_id=deployment_name,
            messages=[
                {"role": "system", "content": "Extract and structure resume details into a structured format."},
                {"role": "user", "content": text}
            ],
            max_tokens=1000
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume text: {str(e)}")

@app.post("/submit-interview/")
async def submit_interview(
    role: str = Form(...),
    company: str = Form(...),
    description: str = Form(...),
    resume: UploadFile = File(...)
):
    resume_text = await extract_resume_text(resume)
    structured_resume = await structure_resume_text(resume_text)

    processed_data = {
        "interview_instructions": (
            "You are an AI Interview Coach, conducting a strict, timed 3-minute interview..."
        ),
        "resume_details": structured_resume,
        "description": description,
        "role": role,
        "company": company
    }

    # Store the processed data in memory (using company name as key)
    processed_data_store[company.lower()] = processed_data

    return {"data": processed_data}

@app.get("/get-interview/")
async def get_interview(company: str):
    company_key = company.lower()
    if company_key in processed_data_store:
        return {"data": processed_data_store[company_key]}
    else:
        raise HTTPException(status_code=404, detail="No interview data found for the given company.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
