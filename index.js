import 'dotenv/config';
import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors'
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// エンジンごとのルーターをインポート
import { voicevoxRouter } from './engine/voicevox.js';
import { voicevoxNemoRouter } from './engine/voicevox-nemo.js';
import { aivisRouter } from './engine/aivis.js';
import { coeiroinkRouter } from './engine/coeiroink.js';
import { logInfo, logError } from './utils/logger.js';

// OpenAPIスキーマ定義をインポート
import { baseOpenApiDocument } from './config/openapi-base.js';

const app = new Hono();

// CORSミドルウェア
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const corsMaxAge = process.env.CORS_MAX_AGE ? parseInt(process.env.CORS_MAX_AGE, 10) : 600;
const serverPort = process.env.SERVER_PORT ? process.env.SERVER_PORT : 8888;

app.use(
  cors({
    origin: corsOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: corsMaxAge,
  })
);

// APIキー認証ミドルウェア
app.use(async (c, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    logError("Server configuration error: API_KEY is not defined. Exiting.");
    process.exit(1); // APIキーが設定されていない場合はサーバーを終了
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: "認証に失敗しました。" }, 401);
  }

  const token = authHeader.substring(7); // 'Bearer ' の後のトークンを取得
  if (token !== apiKey) {
    return c.json({ error: "認証に失敗しました。" }, 401);
  }

  await next();
});

// OpenAPIスキーマ定義を動的に結合
async function loadOpenApiDocuments() {
  const configPath = path.join(__dirname, 'config');
  const files = await fs.readdir(configPath);
  let combinedPaths = {};

  for (const file of files) {
    if (file.startsWith('openapi-') && file !== 'openapi-base.js' && file.endsWith('.js')) {
      const modulePath = path.join(configPath, file);
      const module = await import(modulePath);
      const openApiDoc = Object.values(module)[0]; // exportされている最初のオブジェクトを取得
      combinedPaths = { ...combinedPaths, ...openApiDoc };
    }
  }
  return { ...baseOpenApiDocument, paths: combinedPaths };
}

// swagger
app.get('/swagger', swaggerUI({ url: '/doc' }));
app.get('/doc', async (c) => {
  const openApiDocument = await loadOpenApiDocuments();
  return c.json(openApiDocument);
});

// 各エンジンのルートを登録
app.route('/voice-synthesis-voicevox', voicevoxRouter);
app.route('/voice-synthesis-voicevox-nemo', voicevoxNemoRouter);
app.route('/voice-synthesis-aivis', aivisRouter);
app.route('/voice-synthesis-coeiroink', coeiroinkRouter);

// サーバー起動
serve({ fetch: app.fetch, port:serverPort }, (info) => {
  logInfo(`Voice Synthesis API Server Start!`);
  logInfo(`corsOrigin:`,corsOrigin);
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  for (const devName in networkInterfaces) {
    const iface = networkInterfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        ipAddress = alias.address;
        break;
      }
    }
    if (ipAddress !== 'localhost') break;
  }
  logInfo(`Voice Synthesis API Server listening on http://${ipAddress}:${info.port}`);
});