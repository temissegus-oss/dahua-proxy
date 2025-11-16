// server.js - Render.com
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 10000;

// URL de tu Cloudflare Tunnel (ej: https://cam1.dahua-test.com)
const DAHUA_CLOUD_URL = process.env.DAHUA_CLOUD_URL || 'https://cam1.dahua-test.com';

app.use('/buffered-video', createProxyMiddleware({
  target: DAHUA_CLOUD_URL,
  changeOrigin: true,
  pathRewrite: { '^/buffered-video': '' }
}));

app.get('/playlist.m3u8', async (req, res) => {
  try {
    const response = await fetch(`${DAHUA_CLOUD_URL}/playlist.m3u8`);
    const playlist = await response.text();
    const publicPlaylist = playlist.replace(
      /\/buffer-segment/g, 
      `${req.protocol}://${req.get('host')}/buffer-segment`
    );
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(publicPlaylist);
  } catch (error) {
    res.status(500).send('Error al cargar playlist');
  }
});

app.use('/buffer-segment', createProxyMiddleware({
  target: DAHUA_CLOUD_URL,
  changeOrigin: true,
  pathRewrite: { '^/buffer-segment': '/buffer-segment' }
}));

app.get('/health', (req, res) => {
  res.send('OK - Dahua Buffer Service');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
});