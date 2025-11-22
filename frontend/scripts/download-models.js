#!/usr/bin/env node

/**
 * Download face-api.js model weights
 * Run: node scripts/download-models.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'models');

// Models to download
const MODELS = [
  // Tiny Face Detector (fastest, smallest)
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Face Expression Recognition
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Ensure models directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log(`✅ Created directory: ${PUBLIC_DIR}`);
}

/**
 * Download a single file
 */
function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${MODEL_BASE_URL}/${filename}`;
    const dest = path.join(PUBLIC_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log(`⏭️  ${filename} already exists, skipping...`);
      resolve();
      return;
    }

    console.log(`📥 Downloading ${filename}...`);

    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete incomplete file
      reject(err);
    });
  });
}

/**
 * Download all models
 */
async function downloadAllModels() {
  console.log('🚀 Starting face-api.js models download...\n');
  
  try {
    for (const model of MODELS) {
      await downloadFile(model);
    }
    
    console.log('\n✨ All models downloaded successfully!');
    console.log(`📁 Models location: ${PUBLIC_DIR}`);
  } catch (error) {
    console.error('\n❌ Error downloading models:', error.message);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

// Run download
downloadAllModels();
