import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// callback
export default function handler(req: VercelRequest, res: VercelResponse) {
 const { code } = req.query;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!code) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #d32f2f;">Error: Authorization Code Missing</h2>
        <p>It looks like OLX redirected you here without the <code>code</code> parameter.</p>
      </div>
    `);
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'callback.html');
    let htmlContent = fs.readFileSync(filePath, 'utf8');

    htmlContent = htmlContent.replace('{{CODE}}', String(code));

    return res.status(200).send(htmlContent);
  } catch (error: any) {
    console.error('Error reading HTML template:', error);
    return res.status(500).send('Internal Server Error');
  }
}