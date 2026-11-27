const mammoth = require('mammoth');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const expectedKey = process.env.CONVERTER_API_KEY;
  const providedKey = req.headers['x-api-key'];
  if (expectedKey && providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid x-api-key header.' });
  }

  try {
    const { file_base64, file_name } = req.body || {};
    if (!file_base64) {
      return res.status(400).json({ error: 'Missing required field: file_base64' });
    }

    const buffer = Buffer.from(file_base64, 'base64');
    const isPdf = file_name && file_name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const pdfData = await pdfParse(buffer);
      const lines = (pdfData.text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const html = lines.map(line => `<p>${line}</p>`).join('\n');
      return res.status(200).json({ html });
    }

    const result = await mammoth.convertToHtml({ buffer });
    return res.status(200).json({
      html: result.value || '',
      warnings: result.messages || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Conversion failed: ' + err.message });
  }
};
