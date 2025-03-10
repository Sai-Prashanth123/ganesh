# Resume Generator API

## Environment Configuration

This application uses environment variables for configuration. The environment variables are loaded from a `.env` file in the root directory of the project.

### Setup Instructions

1. Copy the `.env.example` file to a new file named `.env`:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual configuration values:
   - OpenAI API credentials
   - Azure Cosmos DB credentials
   - Azure Blob Storage credentials
   - Admin key for secure endpoints

3. Make sure all required dependencies are installed:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   uvicorn resume:app --reload
   ```

### Required Environment Variables

#### OpenAI API Configuration
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_API_BASE` - Azure OpenAI service endpoint
- `OPENAI_API_TYPE` - Type of API (usually "azure")
- `OPENAI_API_VERSION` - API version
- `OPENAI_DEPLOYMENT_NAME` - Name of the deployed model

#### Azure Cosmos DB Configuration
- `COSMOS_HOST` - Cosmos DB endpoint
- `COSMOS_MASTER_KEY` - Master key for authentication
- `RESUME_DATABASE_ID` - Database ID for resumes
- `RESUME_CONTAINER_ID` - Container ID for resumes
- `JOB_DATABASE_ID` - Database ID for jobs
- `JOB_CONTAINER_ID` - Container ID for jobs
- `TAILORED_RESUME_CONTAINER_ID` - Container ID for tailored resumes

#### Azure Blob Storage Configuration
- `BLOB_CONNECTION_STRING` - Connection string for the blob storage account
- `BLOB_CONTAINER_NAME` - Container name to store blobs
- `BLOB_SAS_TOKEN` - SAS token for blob access
- `BLOB_BASE_URL` - Base URL for blob storage
- `BLOB_SAS_URL` - Full SAS URL for the blob service
- `BLOB_CONNECTION_STRING_WITH_SAS` - Connection string with SAS token

#### Admin Configuration
- `ADMIN_KEY` - Admin key for secure endpoints

### Security Notes

- Never commit your `.env` file to version control
- Keep your keys and secrets secure
- Rotate your keys periodically for better security 