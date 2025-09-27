import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');

// 32バイト (256ビット) のランダムなバイト列を生成
const secretKey = crypto.randomBytes(32).toString('hex');

// .envファイルが存在しない場合は作成
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, '');
}

// .envファイルの内容を読み込み
let envContent = fs.readFileSync(envPath, 'utf8');

// 既存のAPI_KEYを更新または新規追加
if (envContent.includes('API_KEY=')) {
  envContent = envContent.replace(/^API_KEY=.*$/m, `API_KEY=${secretKey}`);
} else {
  envContent += `
API_KEY=${secretKey}`;
}

// .envファイルに書き込み
fs.writeFileSync(envPath, envContent);

console.log('新しいAPI_KEYが.envファイルに保存されました。');
console.log('生成されたシークレットキー:', secretKey);