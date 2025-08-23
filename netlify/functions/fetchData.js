const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Configure Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: 'login-451104',
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: SCOPES,
});

exports.handler = async (event, context) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Validate required environment variables
  if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  // Get and validate sheet name
  const sheetName = event.queryStringParameters?.sheet || 'CutterData';
  const { blockNo, partNo, thickness, partial } = event.queryStringParameters || {};

  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets('v4');
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId,
      range: `${sheetName}!A:W`,
    });

    const rows = response.data.values;
    let filteredData = rows;

    if (blockNo) {
      filteredData = filteredData.filter(row => {
        if (!row[0]) return false;
        return partial === 'true'
          ? row[0].toLowerCase().includes(blockNo.toLowerCase())
          : row[0].toLowerCase() === blockNo.toLowerCase();
      });
    }

    if (partNo) {
      filteredData = filteredData.filter(row => {
        if (!row[1]) return false;
        return partial === 'true'
          ? row[1].toLowerCase().includes(partNo.toLowerCase())
          : row[1].toLowerCase() === partNo.toLowerCase();
      });
    }

    if (thickness) {
      filteredData = filteredData.filter(row => {
        if (!row[2]) return false;
        return row[2].toLowerCase() === thickness.toLowerCase();
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(filteredData),
    };
  } catch (error) {
    console.error('Function error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';

    if (error.code === 404) {
      statusCode = 404;
      errorMessage = 'Sheet not found';
    } else if (error.code === 403) {
      statusCode = 403;
      errorMessage = 'Access denied';
    }

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};