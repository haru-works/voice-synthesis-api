import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDirectory = path.join(__dirname, '..' , 'log');

// ログにタイムスタンプを追加するヘルパー関数
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}]`;
}

function getLogFilePath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return path.join(logDirectory, `${year}-${month}-${day}.log`);
}

async function writeLogToFile(level, message) {
  try {
    await fs.mkdir(logDirectory, { recursive: true });
    const logFilePath = getLogFilePath();
    await fs.appendFile(logFilePath, `${getTimestamp()} [${level.toUpperCase()}] ${message}
`);
  } catch (err) {
    console.error('Failed to write log to file:', err);
  }
}

export const logInfo = (...args) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  console.log(getTimestamp(), ...args);
  writeLogToFile('info', message);
};

export const logError = (...args) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  console.error(getTimestamp(), ...args);
  writeLogToFile('error', message);
};

export const logWarn = (...args) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  console.warn(getTimestamp(), ...args);
  writeLogToFile('warn', message);
};