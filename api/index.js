module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || ''
  });
};
