# Deployment Troubleshooting Guide

This guide will help you diagnose and fix issues with your deployed application.

## Current Status
- ✅ The application works locally on your PC
- ❌ The deployed application is not accessible

## Common Issues and Solutions

### 1. Azure Static Web App Configuration

Check your Azure Static Web App settings:

1. **App Configuration**:
   - Go to your Azure Portal
   - Navigate to your Static Web App resource
   - Check if the build configuration matches your GitHub repository structure
   - Verify the app location is set to `dashboard-/`
   - Make sure the API location is empty or points to the correct API location
   - Confirm output location is set to `build`

2. **Environment Variables**:
   - Check if all required environment variables are set in the Azure Portal
   - You need `REACT_APP_API_URL=https://jobspringbackend.azurewebsites.net`
   - If there are any other environment variables your app needs, add them too

3. **Custom Domain**:
   - Verify if you're using the correct URL to access your application
   - The default URL format should be: `https://{your-site-name}.azurestaticapps.net`

### 2. Backend API Configuration

For your backend on Azure App Service:

1. **CORS Settings**:
   - Ensure CORS is properly configured on your App Service
   - In Azure Portal, go to your App Service → API → CORS
   - Add your frontend URL to the allowed origins
   - Include `https://{your-static-web-app-url}.azurestaticapps.net` 
   - Also add `http://localhost:3000` for local development

2. **API Health**:
   - Check if your API is running by navigating directly to:
     `https://jobspringbackend.azurewebsites.net/`
   - If you get a response, the API is running

### 3. Networking Issues

1. **Firewall Rules**:
   - Check if your corporate firewall is blocking access
   - Try accessing from a different network or device

2. **DNS Propagation**:
   - If you recently configured a custom domain, it might take up to 48 hours for DNS to propagate

### 4. Application Logs

Check application logs for errors:

1. **Frontend Logs**:
   - In Azure Portal, go to your Static Web App → Monitoring → Log stream
   - Look for error messages during build or runtime

2. **Backend Logs**:
   - In Azure Portal, go to your App Service → Monitoring → Log stream
   - Check for API errors or exceptions

## Quick Test

Create a simple HTML file locally with this content to test your API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
</head>
<body>
    <h1>Testing API Connection</h1>
    <button onclick="testAPI()">Test API</button>
    <div id="result"></div>

    <script>
        function testAPI() {
            document.getElementById('result').innerHTML = 'Testing...';
            
            fetch('https://jobspringbackend.azurewebsites.net/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    document.getElementById('result').innerHTML = 
                        `Success! API responded with: ${data}`;
                })
                .catch(error => {
                    document.getElementById('result').innerHTML = 
                        `Error: ${error.message}`;
                });
        }
    </script>
</body>
</html>
```

Open this file in your browser to see if you can connect to your API from your local machine. 