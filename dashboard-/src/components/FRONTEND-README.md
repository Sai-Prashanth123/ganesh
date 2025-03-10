# Frontend Integration Guide

## Resume Download Functionality

### IMPORTANT: Use Direct Download URL

There's an issue with accessing blob URLs directly from the frontend. Instead of using the `blob_url` property, please use the newly added `direct_download_url` property which is now included in all resume responses from the API.

### Example

When fetching resumes with the `/get-resumes/{user_id}` endpoint or a single resume with `/get-resume/{resume_id}`, you'll receive a response like this:

```json
{
  "id": "12345",
  "user_id": "user123",
  "filename": "resume.pdf",
  "blob_url": "https://pdf1.blob.core.windows.net/new/resume_20250310_175716_32021a89.pdf?...",
  "download_url": "/download-resume/12345?user_id=user123",
  "direct_download_url": "/direct-download/12345?user_id=user123",
  ...
}
```

### Recommended Approach

1. Use the `direct_download_url` for download links:

```jsx
// React example
<a href={`${API_BASE_URL}${resume.direct_download_url}`} 
   className="download-button" 
   download={resume.filename}>
   Download Resume
</a>
```

2. Avoid accessing blob URLs directly:

```jsx
// DON'T DO THIS
<a href={resume.blob_url} download={resume.filename}>Download</a>
```

### How It Works

The `direct_download_url` provides these benefits:

1. Handles SAS token management on the server-side
2. Sets proper CORS headers for cross-origin requests
3. Includes proper Content-Disposition headers for downloads
4. Provides appropriate error handling

### Testing

If you encounter any issues with downloads, you can use the `/test-blob-access` endpoint for debugging:

```
GET /test-blob-access?blob_url=https://pdf1.blob.core.windows.net/new/your-file.pdf
```

This will return diagnostic information about the accessibility of the blob and any issues with CORS, etc. 