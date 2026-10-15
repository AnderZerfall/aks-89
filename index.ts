export default function handler(req: any, res: any) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('OLX Bot is running!');
}