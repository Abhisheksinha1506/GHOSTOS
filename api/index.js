const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const htmlPath = path.join(process.cwd(), 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Inject Vercel environment variables directly into window.ENV
    const envVars = {
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || ''
    };
    
    const envScript = `
      <script>
        // Environment variables injected via Vercel serverless function
        window.ENV = ${JSON.stringify(envVars)};
      </script>
    `;
    
    html = html.replace('</head>', envScript + '</head>');
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('Error reading index.html:', err);
    res.status(500).send('Internal Server Error: Could not load GHOST/OS interface.');
  }
};
