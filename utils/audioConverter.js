import ffmpeg from 'fluent-ffmpeg';
import { Readable, Writable } from 'stream';
import { parentPort } from 'worker_threads';

// FFmpegの実行ファイルへのパスを環境変数から取得、またはデフォルト値を設定
const FFMPEG_PATH = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'C:\\FFmpeg\\bin\\ffmpeg.exe' : '/usr/bin/ffmpeg');
ffmpeg.setFfmpegPath(FFMPEG_PATH);

const convertWavToOgg = (wavBuffer) => {
  return new Promise((resolve, reject) => {
    // WAVヘッダーの簡易チェック
    if (wavBuffer.length < 4 || wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
      return reject(new Error('Invalid WAV file: Missing RIFF header.'));
    }
    if (wavBuffer.length < 8 || wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
      return reject(new Error('Invalid WAV file: Missing WAVE format.'));
    }

    const input = new Readable();
    input.push(wavBuffer);
    input.push(null);

    const outputBuffers = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        outputBuffers.push(chunk);
        callback();
      },
    });

    ffmpeg(input)
      .toFormat('ogg')
      .on('error', (err) => {
        console.error('Error converting WAV to OGG:', err);
        reject(err);
      })
      .on('end', () => {
        resolve(Buffer.concat(outputBuffers));
      })
      .pipe(outputStream);
  });
};

// ワーカーからのメッセージをリッスン
if (parentPort) {
  parentPort.on('message', async (message) => {
    if (message.type === 'convert') {
      try {
        const oggBuffer = await convertWavToOgg(Buffer.from(message.wavBuffer));
        parentPort.postMessage({ type: 'result', oggBuffer: oggBuffer.buffer }, [oggBuffer.buffer]);
      } catch (error) {
        parentPort.postMessage({ type: 'error', error: error.message });
      }
    }
  });
}

export { convertWavToOgg };