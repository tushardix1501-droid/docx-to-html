const mammoth = require('mammoth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Best-practice API key authentication check
  const expectedKey = process.env.CONVERTER_API_KEY;
  const providedKey = req.headers['x-api-key'];
  if (expectedKey && providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid x-api-key header.' });
  }

  try {
    const { file_base64 } = req.body || {};
    if (!file_base64) {
      return res.status(400).json({ error: 'Missing required field: file_base64' });
    }

    // Decode Base64 in memory (stateless - nothing saved to disk)
    const buffer = Buffer.from(file_base64, 'base64');
    const result = await mammoth.convertToHtml({ buffer });

    return res.status(200).json({
      html: result.value || '',
      warnings: result.messages || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Conversion failed: ' + err.message });
  }
};
