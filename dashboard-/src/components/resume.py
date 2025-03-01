from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
import json
import fitz
import docx
import os
from azure.cosmos import CosmosClient, PartitionKey, exceptions
import uvicorn
import io
import logging
import time
import uuid
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Frame, PageTemplate, KeepInFrame, HRFlowable, Flowable, Table, TableStyle, ListItem, ListFlowable, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from typing import Any, Dict, List, Optional, Union
import re
from datetime import datetime
from collections import defaultdict
from azure.storage.blob import BlobServiceClient

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app setup
app = FastAPI(title="Resume and Job Processor API", 
             description="API for processing and storing resume and job data",
             version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI API Credentials
openai.api_key = "EhPy4EaDt6osKIvuJzaa4XfQVoWUzNkho4TWgp4unEBWlMNqVfqOJQQJ99BBAC77bzfXJ3w3AAABACOGbr3H"
openai.api_base = "https://betaaijob.openai.azure.com/"
openai.api_type = "azure"
openai.api_version = "2023-03-15-preview"
deployment_name = "gpt-4"

# Azure Cosmos DB Credentials
HOST = "https://jobspringdatabase.documents.azure.com:443/"
MASTER_KEY = "akxvdAbJv3FY33taQkaqXRRaAQB2S3WR22VQM60f0eWLBbXm6uPgtxVlN2ZBtci4pbvRTcBKSx1oACDbgFpzsw=="
RESUME_DATABASE_ID = "resume"
RESUME_CONTAINER_ID = "resume_outputs"
JOB_DATABASE_ID = "resume"
JOB_CONTAINER_ID = "resume_outputs"
TAILORED_RESUME_CONTAINER_ID = "resume_outputs"
PARTITION_KEY_PATH = "/items"

# Azure Blob Storage Credentials
BLOB_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=pdf1;AccountKey=9DzdpGstWRBH9ucrPlZoKofFaMOCxFV0qlha65+NztpF2tstYT5tBs+Ycio3L9KD8iOLy+xTsQJm+AStxwSOLg==;EndpointSuffix=core.windows.net"
BLOB_CONTAINER_NAME = "pdf"

# Initialize Cosmos Client
try:
    client = CosmosClient(HOST, MASTER_KEY)
    logger.info("Successfully connected to Cosmos DB")
except Exception as e:
    logger.error(f"Failed to connect to Cosmos DB: {str(e)}")
    raise

class DynamicSection:
    """Base class for dynamic section handling"""
    def __init__(self, styles, colors):
        self.styles = styles
        self.colors = colors
        
    def process(self, data: Any) -> List[Flowable]:
        raise NotImplementedError

class ExperienceSection(DynamicSection):
    """Handles work experience section with enhanced formatting"""
    def process(self, experiences: List[Dict[str, Any]]) -> List[Flowable]:
        elements = []
        
        for exp in experiences:
            # Create a container for experience elements
            exp_elements = []
            
            # Format title and company in a more prominent way
            title_company = []
            if 'title' in exp:
                title_company.append(exp['title'])
            if 'company' in exp:
                title_company.append(exp['company'])
                
            exp_elements.append(Paragraph(
                ' | '.join(title_company),
                self.styles['ExperienceTitle']
            ))
            
            # Add dates with better formatting
            if 'date' in exp:
                date_text = self._format_date_range(exp['date'])
                exp_elements.append(Paragraph(
                    date_text,
                    self.styles['ExperienceDetails']
                ))
            
            # Add location if available
            if 'location' in exp:
                exp_elements.append(Paragraph(
                    f"📍 {exp['location']}",
                    self.styles['ExperienceDetails']
                ))
            
            # Process responsibilities with better formatting
            if 'responsibilities' in exp:
                exp_elements.append(Spacer(1, 5))
                for resp in exp['responsibilities']:
                    formatted_resp = self._format_responsibility(resp)
                    exp_elements.append(Paragraph(
                        f"• {formatted_resp}",
                        self.styles['ListItem']
                    ))
            
            # Add achievements if available
            if 'achievements' in exp:
                exp_elements.append(Spacer(1, 5))
                exp_elements.append(Paragraph(
                    "Key Achievements:",
                    self.styles['ExperienceSubHeader']
                ))
                for achievement in exp['achievements']:
                    exp_elements.append(Paragraph(
                        f"★ {achievement}",
                        self.styles['Achievement']
                    ))
            
            elements.extend(exp_elements)
            elements.append(Spacer(1, 10))  # Reduced space between experiences
            
        return elements
    
    def _format_date_range(self, date_str: str) -> str:
        """Format date range with icons and proper spacing"""
        try:
            if ' - ' in date_str:
                start, end = date_str.split(' - ')
                return f"🗓️ {start.strip()} → {end.strip()}"
            return f"🗓️ {date_str}"
        except Exception:
            return date_str
    
    def _format_responsibility(self, resp: str) -> str:
        """Format responsibility text with highlighting for key achievements"""
        # Highlight metrics and achievements
        resp = re.sub(r'(\d+[%+]|\$[\d,]+|increased|decreased|improved|launched|created|developed)',
                     r'<b>\1</b>', resp, flags=re.IGNORECASE)
        return resp

class SkillsSection(DynamicSection):
    """Enhanced skills section with visual representation"""
    def process(self, skills: Union[Dict[str, List[str]], List[str]]) -> List[Flowable]:
        elements = []

        if isinstance(skills, dict):
            for category, skill_list in skills.items():
                # Add category header
                elements.append(Paragraph(
                    f"<b>{category}</b>",
                    self.styles['SkillCategory']
                ))
                # Add skills as bullet points
                elements.extend(self._create_bullet_points(skill_list))
                elements.append(Spacer(1, 5))  # Reduced space between skill categories
        elif isinstance(skills, list):
            # Add skills as bullet points
            elements.extend(self._create_bullet_points(skills))

        return elements

    def _create_bullet_points(self, skills: List[str]) -> List[Flowable]:
        """Create bullet point list for skills"""
        bullet_items = [
            ListItem(Paragraph(skill, self.styles['SkillItem']), leftIndent=10)
            for skill in skills
        ]

        return [
            ListFlowable(
                bullet_items,
                bulletType='bullet',
                start=None,
                end=None,
            )
        ]

class ResumePDFGenerator:
    """Enhanced Resume PDF Generator with dynamic section handling and ATS optimization"""
    def __init__(self, output_path: str, theme: str = 'default'):
        self.output_path = output_path
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.3 * inch,  # Reduced top margin
            bottomMargin=0.3 * inch  # Reduced bottom margin
        )
        self.styles = getSampleStyleSheet()
        self.elements = []
        self.header_elements = []
        self.main_content = []
        self.theme = theme
        self.colors = self._get_theme_colors(theme)
        self.setup_styles()
        self._initialize_section_handlers()
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def _get_theme_colors(self, theme: str) -> Dict[str, Any]:
        """Get color scheme based on theme"""
        themes = {
            'default': {
                'primary': colors.HexColor('#2c3e50'),
                'secondary': colors.HexColor('#000000'),
                'accent': colors.HexColor('#e74c3c'),
                'text': colors.HexColor('#2c3e50'),
                'subtext': colors.HexColor('#7f8c8d'),
                'background': colors.HexColor('#ecf0f1'),
                'highlight': colors.HexColor('#3498db')
            },
            'dark': {
                'primary': colors.HexColor('#ffffff'),
                'secondary': colors.HexColor('#cccccc'),
                'accent': colors.HexColor('#e74c3c'),
                'text': colors.HexColor('#ffffff'),
                'subtext': colors.HexColor('#cccccc'),
                'background': colors.HexColor('#2c3e50'),
                'highlight': colors.HexColor('#3498db')
            },
            'light': {
                'primary': colors.HexColor('#000000'),
                'secondary': colors.HexColor('#333333'),
                'accent': colors.HexColor('#e74c3c'),
                'text': colors.HexColor('#000000'),
                'subtext': colors.HexColor('#666666'),
                'background': colors.HexColor('#ffffff'),
                'highlight': colors.HexColor('#3498db')
            }
        }
        return themes.get(theme, themes['default'])
    
    def _initialize_section_handlers(self):
        """Initialize handlers for different resume sections"""
        self.section_handlers = {
            'experience': ExperienceSection(self.styles, self.colors),
            'skills': SkillsSection(self.styles, self.colors)
        }
    
    def setup_styles(self):
        """Set up all required styles for the PDF document"""
        styles_config = {
            'HeaderName': {
                'parent': 'Heading1',
                'fontSize': 18,  
                'textColor': self.colors['primary'],
                'spaceAfter': 6,  
                'alignment': TA_LEFT,
                'leading': 22  
            },
            'HeaderTitle': {
                'parent': 'Normal',
                'fontSize': 12,  # Reduced font size
                'textColor': self.colors['subtext'],
                'alignment': TA_LEFT,
                'spaceAfter': 8,  # Reduced space after
                'leading': 14  # Reduced leading
            },
            'Contact': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'textColor': self.colors['subtext'],
                'alignment': TA_LEFT,
                'spaceAfter': 8,  # Reduced space after
                'leading': 10  # Reduced leading
            },
            'Summary': {
                'parent': 'Normal',
                'fontSize': 9,  # Reduced font size
                'textColor': self.colors['text'],
                'alignment': TA_LEFT,
                'spaceBefore': 4,  # Reduced space before
                'spaceAfter': 8,  # Reduced space after
                'leading': 12  # Reduced leading
            },
            'SectionHeader': {
                'parent': 'Heading2',
                'fontSize': 12,  # Reduced font size
                'textColor': self.colors['primary'],
                'fontName': 'Helvetica-Bold',
                'spaceBefore': 8,  # Reduced space before
                'spaceAfter': 4,  # Reduced space after
                'leading': 14  # Reduced leading
            },
            'Content': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'textColor': self.colors['text'],
                'leftIndent': 8,  # Reduced left indent
                'rightIndent': 8,  # Reduced right indent
                'spaceBefore': 1,  # Reduced space before
                'spaceAfter': 1,  # Reduced space after
                'leading': 10  # Reduced leading
            },
            'ListItem': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'leftIndent': 15,  # Reduced left indent
                'firstLineIndent': -8,  # Adjusted first line indent
                'textColor': self.colors['text'],
                'bulletIndent': 8,  # Reduced bullet indent
                'spaceBefore': 1,  # Reduced space before
                'spaceAfter': 1,  # Reduced space after
                'leading': 10  # Reduced leading
            },
            'SkillCategory': {
                'parent': 'Normal',
                'fontSize': 10,  # Reduced font size
                'textColor': self.colors['secondary'],
                'spaceBefore': 4,  # Reduced space before
                'spaceAfter': 2,  # Reduced space after
                'leading': 12,  # Reduced leading
                'fontName': 'Helvetica-Bold'
            },
            'ExperienceTitle': {
                'parent': 'Normal',
                'fontSize': 10,  # Reduced font size
                'textColor': self.colors['primary'],
                'spaceBefore': 4,  # Reduced space before
                'spaceAfter': 1,  # Reduced space after
                'leading': 12,  # Reduced leading
                'fontName': 'Helvetica-Bold'
            },
            'ExperienceDetails': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'textColor': self.colors['subtext'],
                'spaceBefore': 1,  # Reduced space before
                'spaceAfter': 2,  # Reduced space after
                'leading': 10  # Reduced leading
            },
            'ExperienceSubHeader': {
                'parent': 'Normal',
                'fontSize': 9,  # Reduced font size
                'textColor': self.colors['accent'],
                'spaceBefore': 2,  # Reduced space before
                'spaceAfter': 2,  # Reduced space after
                'leading': 11,  # Reduced leading
                'fontName': 'Helvetica-Bold'
            },
            'Achievement': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'textColor': self.colors['highlight'],
                'leftIndent': 15,  # Reduced left indent
                'firstLineIndent': -8,  # Adjusted first line indent
                'spaceBefore': 1,  # Reduced space before
                'spaceAfter': 1,  # Reduced space after
                'leading': 10  # Reduced leading
            },
            'SkillItem': {
                'parent': 'Normal',
                'fontSize': 8,  # Reduced font size
                'textColor': self.colors['text'],
                'spaceBefore': 1,  # Reduced space before
                'spaceAfter': 1,  # Reduced space after
                'leading': 10  # Reduced leading
            }
        }

        # Add all styles to the stylesheet
        for style_name, style_props in styles_config.items():
            parent_style = self.styles[style_props.pop('parent')]
            self.styles.add(ParagraphStyle(
                style_name,
                parent=parent_style,
                **style_props
            ))
    
    def process_section(self, section_name: str, content: Any) -> List[Flowable]:
        """Process a section using the appropriate handler"""
        handler = self.section_handlers.get(section_name.lower())
        if handler:
            return handler.process(content)
        return self.add_section(section_name, content)
    
    def process_resume(self, resume_data: Dict[str, Any]):
        """Enhanced resume processing with dynamic section handling"""
        try:
            self.create_header_section(resume_data)
            
            # Process contact info
            contact_info = {
                field: resume_data.get(field)
                for field in ['email', 'phone', 'location', 'linkedin', 'website']
                if field in resume_data
            }
            if contact_info:
                contact_text = self.format_contact_info(contact_info)
                self.main_content.append(Paragraph(contact_text, self.styles['Contact']))
            
            # Process other sections dynamically
            skip_fields = {'name', 'summary'} | set(contact_info.keys())
            for key, value in resume_data.items():
                if key not in skip_fields:
                    section_title = re.sub(r'([a-z])([A-Z])', r'\1 \2', key)
                    section_title = section_title.replace('_', ' ').title()
                    
                    self.main_content.append(self.add_section_divider())
                    self.main_content.append(Paragraph(section_title, self.styles['SectionHeader']))
                    
                    # Process section content
                    section_elements = self.process_section(key, value)
                    self.main_content.extend(section_elements)
        
        except Exception as e:
            self.logger.error(f"Error processing resume data: {str(e)}")
            raise

    def format_contact_info(self, contact_info: Dict[str, str]) -> str:
        """Format contact information with icons"""
        info_parts = []
        icons = {
            'email': '✉️',
            'phone': '📞',
            'linkedin': '🔗',
            'website': '🌐',
            'location': '📍'
        }

        for key, value in contact_info.items():
            if value and value.strip():
                clean_key = re.sub(r'[^\w\s]', '', key)
                icon = icons.get(clean_key.lower(), '')
                info_parts.append(f"{icon} {value}")

        return " | ".join(info_parts)

    def add_decorative_header(self):
        """Add decorative header"""
        self.elements.append(HRFlowable(
            width="100%",
            thickness=2,
            color=self.colors['secondary'],
            spaceBefore=5,
            spaceAfter=5
        ))

    def add_section_divider(self):
        """Add a section divider"""
        return HRFlowable(
            width="90%",
            thickness=1,
            color=self.colors['subtext'],
            spaceBefore=6,  # Reduced space before
            spaceAfter=8  # Reduced space after
        )

    def add_section(self, title: str, content: Any):
        """Add a generic section to the resume"""
        elements = []
        
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    for key, value in item.items():
                        if isinstance(value, str):
                            elements.append(Paragraph(
                                f"<b>{key}</b>: {value}", 
                                self.styles['Content']
                            ))
                        elif isinstance(value, list):
                            elements.append(Paragraph(
                                f"<b>{key}</b>:", 
                                self.styles['Content']
                            ))
                            for subitem in value:
                                elements.append(Paragraph(
                                    f"\u2022 {subitem}", 
                                    self.styles['ListItem']
                                ))
                    elements.append(Spacer(1, 3))  # Reduced space between items
                else:
                    elements.append(Paragraph(f"\u2022 {item}", self.styles['ListItem']))
        elif isinstance(content, dict):
            for key, value in content.items():
                if isinstance(value, str):
                    elements.append(Paragraph(
                        f"<b>{key}</b>: {value}", 
                        self.styles['Content']
                    ))
                elif isinstance(value, list):
                    elements.append(Paragraph(
                        f"<b>{key}</b>:", 
                        self.styles['Content']
                    ))
                    for item in value:
                        elements.append(Paragraph(
                            f"\u2022 {item}", 
                            self.styles['ListItem']
                        ))
        elif isinstance(content, str):
            elements.append(Paragraph(content, self.styles['Content']))
            
        return elements

    def create_header_section(self, resume_data: Dict[str, Any]):
        """Create the header section with name and summary"""
        if 'name' in resume_data:
            self.header_elements.append(Paragraph(
                resume_data['name'], 
                self.styles['HeaderName']
            ))
            
        if 'summary' in resume_data:
            self.header_elements.append(Paragraph(
                resume_data['summary'], 
                self.styles['Summary']
            ))

    def generate_pdf(self):
        """Generate the final PDF with ATS optimization"""
        try:
            # Create a single column layout
            content_frame = Frame(
                self.doc.leftMargin,
                self.doc.bottomMargin,
                self.doc.width,
                self.doc.height,  # Full page height
                leftPadding=3,
                rightPadding=3,
                topPadding=3,
                bottomPadding=3,
                showBoundary=0
            )

            def page_background(canvas, doc):
                canvas.saveState()
                canvas.setFillColor(self.colors['background'])
                canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
                canvas.restoreState()

            template = PageTemplate(
                id='SingleColumn',
                frames=[content_frame],
                onPage=page_background
            )

            self.doc.addPageTemplates([template])

            # Combine all content
            all_content = self.header_elements + self.main_content

            # Set document metadata for ATS optimization
            self.doc.title = "Resume"
            self.doc.author = "Resume Generator"
            self.doc.subject = "Resume"
            self.doc.keywords = ["Resume", "CV", "Job Application"]

            # Generate the PDF
            self.doc.build(all_content)

            self.logger.info(f"Resume PDF generated successfully at: {self.output_path}")
        except Exception as e:
            self.logger.error(f"Error generating PDF: {str(e)}")
            raise

    @staticmethod
    def convert_resume_json_to_pdf(json_file_path: str, pdf_output_path: str, theme: str = 'default'):
        """Convert resume JSON file to PDF"""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                resume_data = json.load(file)

            pdf_gen = ResumePDFGenerator(pdf_output_path, theme)
            pdf_gen.process_resume(resume_data)
            pdf_gen.generate_pdf()
            
            return True

        except FileNotFoundError:
            logging.error(f"Resume JSON file not found: {json_file_path}")
            raise
        except json.JSONDecodeError:
            logging.error("Invalid JSON format")
            raise
        except Exception as e:
            logging.error(f"An error occurred: {str(e)}")
            raise
# Database and container management functions
def get_or_create_database(database_id: str):
    try:
        database = client.get_database_client(database_id)
        logger.info(f"Successfully connected to database: {database_id}")
        return database
    except exceptions.CosmosResourceNotFoundError:
        logger.info(f"Creating new database: {database_id}")
        return client.create_database(database_id)
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_or_create_container(database, container_id: str):
    try:
        container = database.get_container_client(container_id)
        logger.info(f"Successfully connected to container: {container_id}")
        return container
    except exceptions.CosmosResourceNotFoundError:
        logger.info(f"Creating new container: {container_id}")
        return database.create_container(id=container_id, partition_key=PartitionKey(path=PARTITION_KEY_PATH))
    except Exception as e:
        logger.error(f"Container error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Container error: {str(e)}")

def store_json(container, doc_id: str, data: dict, max_retries=3):
    attempt = 0
    while attempt < max_retries:
        try:
            document = {"id": doc_id, "data": data}
            existing_doc = list(container.query_items(
                query="SELECT * FROM c WHERE c.id=@id",
                parameters=[{"name": "@id", "value": doc_id}],
                enable_cross_partition_query=True
            ))
            if existing_doc:
                new_id = f"{doc_id}_{int(time.time())}_{uuid.uuid4().hex[:8]}"
                document["id"] = new_id
                logger.warning(f"Document with ID {doc_id} exists. Storing with new ID: {new_id}")
            container.create_item(body=document)
            logger.info(f"Successfully stored document with ID: {document['id']}")
            return document["id"]
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"Error storing in Cosmos DB (Attempt {attempt + 1}): {str(e)}")
            attempt += 1
            time.sleep(2 ** attempt)
    raise HTTPException(status_code=500, detail="Failed to store document after multiple attempts.")

# GPT API functions
async def resume_to_json(resume_text: str) -> dict:
    """Convert resume text to JSON using OpenAI GPT"""
    try:
        response = await openai.ChatCompletion.acreate(
            engine=deployment_name,
            messages=[
                {"role": "system", "content": "You are a resume parser that converts resume text to structured JSON."},
                {"role": "user", "content": f"Convert this resume text to JSON format with sections for personal info, summary, experience, education, and skills:\n\n{resume_text}"}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        json_string = response.choices[0].message.content
        # Clean up the response to ensure it's valid JSON
        json_string = json_string.strip()
        if json_string.startswith("```json"):
            json_string = json_string[7:-3]  # Remove ```json and ``` markers
        
        return json.loads(json_string)
    except Exception as e:
        logger.error(f"Error in resume_to_json: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to convert resume to JSON format")

async def analyze_job_details(title: str, description: str) -> dict:
    """Analyze job details using OpenAI GPT"""
    try:
        response = await openai.ChatCompletion.acreate(
            engine=deployment_name,
            messages=[
                {"role": "system", "content": "You are a job analysis expert. Always respond with valid JSON containing requirements, responsibilities, and qualifications."},
                {"role": "user", "content": f"Convert this job posting into JSON format:\n\nTitle: {title}\n\nDescription: {description}"}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up the response to ensure it's valid JSON
        if content.startswith("```json"):
            content = content[7:-3]  # Remove ```json and ``` markers
        elif content.startswith("{"):
            content = content  # Already JSON format
        else:
            raise ValueError("Response is not in valid JSON format")
            
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON response: {content}")
        raise HTTPException(status_code=500, detail="Failed to parse job details response")
    except Exception as e:
        logger.error(f"Error in analyze_job_details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze job details")

async def generate_tailored_resume(resume_data: dict, job_data: dict) -> dict:
    """Generate tailored resume using OpenAI GPT"""
    try:
        response = await openai.ChatCompletion.acreate(
            engine=deployment_name,
            messages=[
                {"role": "system", "content": "You are an expert at tailoring resumes to specific job requirements. Always respond with valid JSON."},
                {"role": "user", "content": f"Tailor this resume to the job requirements and return a valid JSON object:\n\nResume: {json.dumps(resume_data)}\n\nJob Details: {json.dumps(job_data)}"}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up the response to ensure it's valid JSON
        if content.startswith("```json"):
            content = content[7:-3]  # Remove ```json and ``` markers
        elif not content.startswith("{"):
            raise ValueError("Response is not in valid JSON format")
            
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON response: {content}")
            raise ValueError("Response could not be parsed as JSON")
            
    except ValueError as e:
        logger.error(f"Value error in generate_tailored_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error in generate_tailored_resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate tailored resume")

# PDF Generation classes (DynamicSection, ExperienceSection, SkillsSection, ResumePDFGenerator)
# ... (Keep these classes as they were in the original script)

# PDF upload function
def upload_pdf_to_azure(pdf_file_path: str):
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        pdf_file_name = f"resume_{timestamp}_{unique_id}.pdf"
        
        blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(BLOB_CONTAINER_NAME)
        
        logger.info(f"Uploading file: {pdf_file_name} to container: {BLOB_CONTAINER_NAME}")
        with open(pdf_file_path, "rb") as pdf_data:
            blob_client = container_client.upload_blob(name=pdf_file_name, data=pdf_data, overwrite=True)
        
        logger.info("PDF uploaded successfully!")
        return pdf_file_name
    except Exception as e:
        logger.error(f"An error occurred while uploading PDF: {str(e)}")
        return None

def extract_text_from_pdf(contents: bytes) -> str:
    """Extract text from PDF content"""
    try:
        with fitz.open(stream=contents, filetype="pdf") as doc:
            text = ""
            for page in doc:
                text += page.get_text()
            return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to extract text from PDF")

def extract_text_from_docx(contents: bytes) -> str:
    """Extract text from DOCX content"""
    try:
        doc = docx.Document(io.BytesIO(contents))
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return '\n'.join(text)
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to extract text from DOCX")

# FastAPI route
@app.post("/process-all/")
async def process_all(title: str = Form(...), description: str = Form(...), file: UploadFile = File(...)):
    logger.info(f"Processing resume file: {file.filename}")
    
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        logger.error("Invalid file type")
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    try:
        # Process Resume
        contents = await file.read()
        
        if file.filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(contents)
        else:
            resume_text = extract_text_from_docx(contents)
        
        resume_json_data = await resume_to_json(resume_text)
        
        resume_database = get_or_create_database(RESUME_DATABASE_ID)
        resume_container = get_or_create_container(resume_database, RESUME_CONTAINER_ID)
        
        file_name = os.path.splitext(file.filename)[0]
        resume_name = re.sub(r'[^a-zA-Z0-9_-]', '_', resume_json_data.get("name", file_name)).replace(" ", "_").lower()
        
        resume_id = store_json(resume_container, resume_name, resume_json_data)
        
        # Process Job Details
        job_json_data = await analyze_job_details(title, description)
        
        job_database = get_or_create_database(JOB_DATABASE_ID)
        job_container = get_or_create_container(job_database, JOB_CONTAINER_ID)
        
        job_id = re.sub(r'[^a-zA-Z0-9_-]', '_', title).replace(" ", "_").lower()
        job_id = store_json(job_container, job_id, job_json_data)
        
        # Generate Tailored Resume
        tailored_resume_json = await generate_tailored_resume(resume_json_data, job_json_data)
        
        tailored_resume_database = get_or_create_database(RESUME_DATABASE_ID)
        tailored_resume_container = get_or_create_container(tailored_resume_database, TAILORED_RESUME_CONTAINER_ID)
        
        tailored_resume_id = f"{resume_name}_tailored_for_{job_id}"
        tailored_resume_id = store_json(tailored_resume_container, tailored_resume_id, tailored_resume_json)
        
        # Generate PDF
        pdf_gen = ResumePDFGenerator("temp_resume.pdf", "default")
        pdf_gen.process_resume(tailored_resume_json)
        pdf_gen.generate_pdf()
        
        # Upload PDF to Azure Blob Storage
        pdf_file_name = upload_pdf_to_azure("temp_resume.pdf")
        
        if pdf_file_name:
            os.remove("temp_resume.pdf")  # Clean up temporary file
        else:
            logger.error("Failed to upload PDF to Azure Blob Storage")
        
        logger.info(f"Successfully processed resume and job details")
        return JSONResponse(
            status_code=200,
            content={
                "message": "Resume and job details processed successfully",
                "resume_id": resume_id,
                "job_id": job_id,
                "tailored_resume_id": tailored_resume_id,
                "pdf_file_name": pdf_file_name
            }
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)