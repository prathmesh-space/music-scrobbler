// Backend Server for ACRCloud Song Recognition
// This should be run separately from your frontend

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'node:crypto';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();



const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()) || ['http://localhost:3000', 'http://localhost:5173']
}));

app.use(express.json());

// ACRCloud Configuration from environment variables
const ACR_CONFIG = {
  host: process.env.ACR_HOST || 'identify-eu-west-1.acrcloud.com',
  access_key: process.env.ACR_ACCESS_KEY,
  access_secret: process.env.ACR_ACCESS_SECRET
};

// Validate configuration
if (!ACR_CONFIG.access_key || !ACR_CONFIG.access_secret) {
  console.error('❌ ERROR: ACRCloud credentials not found!');
  console.error('Please set ACR_ACCESS_KEY and ACR_ACCESS_SECRET environment variables');
  process.exit(1);
}

/**
 * Generate signature for ACRCloud API authentication
 */
function generateSignature(method, uri, accessKey, secretKey, timestamp) {
  const stringToSign = [
    method,
    uri,
    accessKey,
    'audio',
    '1',
    timestamp.toString()
  ].join('\n');

  const signature = crypto
    .createHmac('sha1', secretKey)
    .update(Buffer.from(stringToSign, 'utf-8'))
    .digest('base64');

  return signature;
}

/**
 * Parse ACRCloud response into a cleaner format
 */
function parseACRCloudResponse(result) {
  console.log('ACRCloud Response:', JSON.stringify(result, null, 2));

  // Check for errors
  if (result.status.code !== 0) {
    return {
      success: false,
      message: result.status.msg || 'Recognition failed'
    };
  }

  const metadata = result.metadata;
  
  // No music found
  if (!metadata || !metadata.music || metadata.music.length === 0) {
    return {
      success: false,
      message: 'No music found in the audio'
    };
  }

  // Extract first (best) match
  const music = metadata.music[0];

  return {
    success: true,
    title: music.title,
    artists: music.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    album: music.album?.name,
    releaseDate: music.release_date,
    duration: music.duration_ms,
    score: music.score,
    genres: music.genres?.map(g => g.name) || [],
    label: music.label,
    externalIds: {
      spotify: music.external_ids?.spotify,
      youtube: music.external_ids?.youtube,
      deezer: music.external_ids?.deezer,
      apple_music: music.external_ids?.apple_music
    },
    externalMetadata: music.external_metadata
  };
}

/**
 * POST /api/recognize
 * Main endpoint for song recognition
 */
app.post('/api/recognize', upload.single('audio'), async (req, res) => {
  console.log('📝 Received recognition request');

  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No audio file provided'
    });
  }

  console.log(`📁 File info: ${req.file.originalname}, ${req.file.size} bytes`);

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(
      'POST',
      '/v1/identify',
      ACR_CONFIG.access_key,
      ACR_CONFIG.access_secret,
      timestamp
    );

    // Prepare form data for ACRCloud
    const formData = new FormData();
    formData.append('sample', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('access_key', ACR_CONFIG.access_key);
    formData.append('sample_bytes', req.file.size);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('data_type', 'audio');
    formData.append('signature_version', '1');

    console.log('🔍 Sending request to ACRCloud...');

    // Call ACRCloud API
    const response = await axios.post(
      `https://${ACR_CONFIG.host}/v1/identify`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000 // 15 second timeout
      }
    );

    console.log('✅ Received response from ACRCloud');

    // Parse and return result
    const parsedResult = parseACRCloudResponse(response.data);
    
    if (parsedResult.success) {
      console.log(`🎵 Found: ${parsedResult.title} by ${parsedResult.artists}`);
    } else {
      console.log('❌ No match found');
    }

    res.json(parsedResult);

  } catch (error) {
    console.error('❌ Error during recognition:', error.message);

    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout - please try again'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.status?.msg || 'ACRCloud API error'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during recognition'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    acrcloud: {
      configured: !!(ACR_CONFIG.access_key && ACR_CONFIG.access_secret),
      host: ACR_CONFIG.host
    }
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'SonicID Backend API',
    version: '1.0.0',
    endpoints: {
      recognize: 'POST /api/recognize',
      health: 'GET /health'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🚀 SonicID Backend Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔑 ACRCloud host: ${ACR_CONFIG.host}`);
  console.log(`✅ Credentials configured: ${!!(ACR_CONFIG.access_key && ACR_CONFIG.access_secret)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
