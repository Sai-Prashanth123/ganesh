# Backend Connection Testing Guide

This guide explains how to verify that your frontend is correctly connecting to the Azure-hosted backend.

## Connection Status

✅ **The backend is accessible and functioning correctly.**

The connection test has been run and confirmed that the frontend can successfully connect to the Azure-hosted backend at `https://jobspringbackend.azurewebsites.net`.

## Quick Connection Test

To quickly check if your frontend can connect to the backend:

1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Run the following command:
   ```javascript
   testBackendConnection().then(result => console.log(result.success ? 'Connected!' : 'Failed to connect'));
   ```

## Visual Connection Indicator

The application now includes a visual connection status indicator at the top of the dashboard. This indicator shows:

- 🟡 Yellow: Checking connection
- 🟢 Green: Connected successfully
- 🔴 Red: Connection failed

You can click the "×" button to hide the indicator.

## Running the Command-Line Test

For a more comprehensive test that you can run from the command line:

1. Open a terminal/command prompt
2. Navigate to the project directory
3. Run:
   ```bash
   npm run test:connection
   ```

This will run a series of tests against the backend and provide detailed results.

## Common Issues and Solutions

### CORS Errors

If you see errors related to CORS (Cross-Origin Resource Sharing) in the console:

```
Access to fetch at 'https://jobspringbackend.azurewebsites.net/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
- Ensure the backend has CORS properly configured to allow requests from your frontend origin
- Check that the backend's CORS configuration includes all necessary HTTP methods (GET, POST, etc.)

### Connection Timeout

If the connection test times out:

**Solution:**
- Verify the backend service is running
- Check if the Azure service is experiencing any outages
- Try accessing the backend URL directly in a browser to see if it responds

### 404 Not Found Errors

If you see 404 errors for specific endpoints:

**Solution:**
- Verify that the endpoint paths in your frontend code match exactly what the backend expects
- Check if the backend API has changed its URL structure

## Generating a Diagnostic Report

To generate a detailed diagnostic report:

1. Open your browser's developer console
2. Run:
   ```javascript
   generateConnectionReport().then(report => console.log(report));
   ```

This will create a markdown-formatted report with detailed information about the connection status.

## Manual API Testing

You can also test specific API endpoints directly:

1. Use a tool like [Postman](https://www.postman.com/) or [curl](https://curl.se/)
2. Send requests to `https://jobspringbackend.azurewebsites.net/[endpoint]`
3. Check the responses to verify the backend is working correctly

Example curl command:
```bash
curl -v https://jobspringbackend.azurewebsites.net/
``` 