const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          let value = match[2];
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          envVars[match[1]] = value;
        }
      }
    });
  }
  
  // process.env takes precedence over .env file
  if (process.env.GROQ_API_KEY) envVars.GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (process.env.OPENROUTER_API_KEY) envVars.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  return envVars;
}

// Load HTML and inject environment variables
function getHtmlWithEnv(envVars) {
  const htmlPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inject environment variables as JavaScript
  const envScript = `
    <script>
      // Environment variables loaded from .env
      window.ENV = ${JSON.stringify(envVars)};
    </script>
  `;
  
  // Insert before the closing </head> tag
  html = html.replace('</head>', envScript + '</head>');
  
  return html;
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
    const envVars = loadEnv();
    const html = getHtmlWithEnv(envVars);
    
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(html)
    });
    res.end(html);
  } else {
    // Serve static files if needed
    const filePath = path.join(__dirname, parsedUrl.pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 GHOST/OS Server running at http://localhost:${PORT}`);
  console.log(`📁 Environment variables loaded from .env`);
  console.log(`🔑 Available keys: ${Object.keys(loadEnv()).filter(k => k.includes('API_KEY')).join(', ')}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down GHOST/OS Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
