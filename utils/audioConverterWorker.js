import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const convertWavToOggWithWorker = (wavBuffer) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, 'audioConverter.js'));

    worker.on('message', (message) => {
      if (message.type === 'result') {
        resolve(Buffer.from(message.oggBuffer));
      } else if (message.type === 'error') {
        reject(new Error(message.error));
      }
      worker.terminate();
    });

    worker.on('error', (err) => {
      reject(err);
      worker.terminate();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage({ type: 'convert', wavBuffer: wavBuffer.buffer }, [wavBuffer.buffer]);
  });
};
