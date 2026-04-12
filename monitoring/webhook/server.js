// Simple webhook server that receives Alertmanager notifications
// Simulates Slack/PagerDuty in local dev
const http = require('http');

const PORT = 5001;
const alerts = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/alerts')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const timestamp = new Date().toISOString();

        payload.alerts?.forEach(alert => {
          const entry = {
            id: Date.now(),
            timestamp,
            status: alert.status,
            severity: alert.labels?.severity || 'unknown',
            alertname: alert.labels?.alertname,
            summary: alert.annotations?.summary,
            description: alert.annotations?.description,
            pod: alert.labels?.pod,
            url: req.url,
          };

          alerts.unshift(entry);
          if (alerts.length > 100) alerts.pop(); // Keep last 100

          const icon = alert.status === 'firing'
            ? (entry.severity === 'critical' ? '🔴' : '🟡')
            : '✅';

          console.log(`\n${icon} [${timestamp}] ALERT ${alert.status.toUpperCase()}`);
          console.log(`   Name: ${entry.alertname}`);
          console.log(`   Severity: ${entry.severity}`);
          console.log(`   Summary: ${entry.summary}`);
          if (entry.description) console.log(`   Detail: ${entry.description}`);
          if (entry.pod) console.log(`   Pod: ${entry.pod}`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (err) {
        console.error('Parse error:', err.message);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else if (req.method === 'GET' && req.url === '/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ total: alerts.length, alerts }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 Alert Webhook Receiver running on port ${PORT}`);
  console.log(`   POST /alerts        → receive Alertmanager webhooks`);
  console.log(`   GET  /history       → view all received alerts`);
});
