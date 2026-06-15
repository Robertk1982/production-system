const { google } = require('googleapis');
const { Readable } = require('stream');

const PARENT_FOLDER_ID = '1R8zz1X_qmRDMM3X82jI_0lhDLF6qEpTe';

let cachedAuth = null;

async function getAuth() {
  if (cachedAuth) return cachedAuth;
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  cachedAuth = auth;
  return auth;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, photoBase64, photoNumber } = req.body;

    if (!orderId || !photoBase64 || !photoNumber) {
      return res.status(400).json({ error: 'Missing fields: orderId, photoBase64, photoNumber' });
    }

    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Szukaj folderu zamówienia
    const folderSearch = await drive.files.list({
      q: `name='${orderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${PARENT_FOLDER_ID}' in parents`,
      pageSize: 1,
      fields: 'files(id, name)',
    });

    let folderId;
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const folder = await drive.files.create({
        requestBody: {
          name: orderId,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [PARENT_FOLDER_ID],
        },
        fields: 'id',
      });
      folderId = folder.data.id;
    }

    // Upload zdjęcia
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${orderId}_${photoNumber}.jpg`;

    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'image/jpeg',
        parents: [folderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(buffer),
      },
      fields: 'id, name',
    });

    return res.status(200).json({
      success: true,
      fileId: file.data.id,
      fileName: file.data.name,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
