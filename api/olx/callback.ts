import type { VercelRequest, VercelResponse } from '@vercel/node';

// callback
export default function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send(`
      <h2>Помилка: Код авторизації відсутній</h2>
      <p>Схоже, OLX перенаправив вас сюди без параметра <code>code</code>.</p>
    `);
  }

  return res.status(200).send(`
    <html>
      <head>
        <title>OLX Auth Success</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f4f4f9; }
          .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
          code { background: #eee; padding: 5px 10px; border-radius: 4px; word-break: break-all; display: block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Авторизація успішна!</h2>
          <p>Скопіюйте цей код та використайте його для отримання <b>Refresh Token</b>:</p>
          <code>${code}</code>
        </div>
      </body>
    </html>
  `);
}