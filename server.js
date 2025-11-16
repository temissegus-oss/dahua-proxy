// server.js - Render.com version
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 10000;

// URL pública de tu Cloudflare Tunnel (cámbiala)
const DAHUA_CLOUD_URL = 'https://dahua.your-subdomain.workers.dev';

// Proxy al servidor local (con buffer de 10s)
app.use('/buffered-video', createProxyMiddleware({
  target: `${DAHUA_CLOUD_URL}/buffered-video`,
  changeOrigin: true,
  pathRewrite: { '^/buffered-video': '' }
}));

// Playlist HLS
app.get('/playlist.m3u8', async (req, res) => {
  try {
    const response = await fetch(`${DAHUA_CLOUD_URL}/playlist.m3u8`);
    const playlist = await response.text();
    
    // Reemplazar URLs locales con URLs públicas
    const publicPlaylist = playlist.replace(
      /\/buffer-segment/g, 
      `${req.protocol}://${req.get('host')}/buffer-segment`
    );
    
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(publicPlaylist);
  } catch (error) {
    console.error('Playlist error:', error);
    res.status(500).send('Error al cargar playlist');
  }
});

// Proxy para segmentos
app.use('/buffer-segment', createProxyMiddleware({
  target: DAHUA_CLOUD_URL,
  changeOrigin: true,
  pathRewrite: { '^/buffer-segment': '/buffer-segment' }
}));

// Salud para Render
app.get('/health', (req, res) => {
  res.send('OK - Dahua Buffer Service');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Render.com corriendo en puerto ${PORT}`);
  console.log(`🔗 URL pública: https://tu-app.onrender.com`);
});
