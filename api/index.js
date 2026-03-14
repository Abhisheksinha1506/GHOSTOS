const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Pick up Vercel environment variables
  const envVars = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || ''
  };

  // Inject them as window.ENV before </head>
  const envScript = `
    <script>
      window.ENV = ${JSON.stringify(envVars)};
    </script>
  `;
  html = html.replace('</head>', envScript + '</head>');

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
