import 'dotenv/config';
import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors'

// エンジンごとのルーターをインポート
import { voicevoxRouter } from './engine/voicevox.js';
import { voicevoxNemoRouter } from './engine/voicevox-nemo.js';
import { aivisRouter } from './engine/aivis.js';
import { coeiroinkRouter } from './engine/coeiroink.js';

// OpenAPIスキーマ定義をインポート
import { baseOpenApiDocument } from './config/openapi-base.js';
import { voicevoxOpenApi } from './config/openapi-voicevox.js';
import { voicevoxNemoOpenApi } from './config/openapi-voicevox-nemo.js';
import { aivisOpenApi } from './config/openapi-aivis.js';
import { coeiroinkOpenApi } from './config/openapi-coeiroink.js';

const app = new Hono();

// CORSミドルウェア
app.use(cors());

// APIキー認証ミドルウェア
// OpenAPIスキーマ定義を結合
const openApiDocument = {
  ...baseOpenApiDocument,
  paths: {
    ...voicevoxOpenApi,
    ...voicevoxNemoOpenApi,
    ...aivisOpenApi,
    ...coeiroinkOpenApi,
  },
};

app.get('/swagger', swaggerUI({ url: '/doc' }));
app.get('/doc', (c) => c.json(openApiDocument));

// APIキー認証ミドルウェア
app.use(async (c, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Server configuration error: API_KEY is not defined.");
    return c.json({ error: "サーバー設定エラーが発生しました。" }, 500);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: "認証情報が不足しているか、形式が正しくありません。" }, 401);
  }

  const token = authHeader.substring(7); // 'Bearer ' の後のトークンを取得
  if (token !== apiKey) {
    return c.json({ error: "無効なAPIキーです。" }, 401);
  }

  await next();
});

// 各エンジンのルートを登録
app.route('/voice-synthesis-voicevox', voicevoxRouter);
app.route('/voice-synthesis-voicevox-nemo', voicevoxNemoRouter);
app.route('/voice-synthesis-aivis', aivisRouter);
app.route('/voice-synthesis-coeiroink', coeiroinkRouter);

// サーバー起動
const port = 8888;
console.log(`Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});
