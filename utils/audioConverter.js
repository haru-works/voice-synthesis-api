import ffmpeg from 'fluent-ffmpeg';
import { Readable, Writable } from 'stream';
import { parentPort } from 'worker_threads';

// ここにFFmpegの実行ファイルへの絶対パスを設定してください
// ご自身の環境に合わせてパスを修正してください。
if (process.platform === 'win32') {
  ffmpeg.setFfmpegPath('C:\\FFmpeg\\bin\\ffmpeg.exe');
} else if (process.platform === 'linux') {
  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
}

const convertWavToOgg = (wavBuffer) => {
  return new Promise((resolve, reject) => {
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
