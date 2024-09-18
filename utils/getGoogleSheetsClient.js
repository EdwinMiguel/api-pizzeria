const { google } = require('googleapis');

exports.getGoogleSheetsClient = async ()  => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    project_id: process.env.GOOGLE_PROJECT_ID,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheetsApi = google.sheets({
    version: 'v4',
    auth: client
  });

  return sheetsApi;
}

