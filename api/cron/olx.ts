import type { VercelRequest, VercelResponse } from '@vercel/node';

// placeholder for now
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const tokenRes = await fetch('https://www.olx.ua/api/open/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.OLX_CLIENT_ID,
        client_secret: process.env.OLX_CLIENT_SECRET,
        refresh_token: process.env.OLX_REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(`Error while getting OLX token: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;
    console.log('Access token successfully retrieved!');

    return res.status(200).json({ 
      success: true, 
      message: 'OLX job was finished successfully' 
    });

  } catch (error: any) {
    console.error('Error during OLX job:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}