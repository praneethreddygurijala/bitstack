export default async function handler(req, res) {
  const { q, engine } = req.query;
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'SERPAPI_KEY is not configured on the server.' });
  }

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const searchEngine = engine || 'google_local';
  const url = `https://serpapi.com/search.json?engine=${encodeURIComponent(searchEngine)}&q=${encodeURIComponent(q)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch results', details: error.message });
  }
}
