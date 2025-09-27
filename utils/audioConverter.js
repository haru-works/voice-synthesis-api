import ffmpeg from 'fluent-ffmpeg';
import { Readable, Writable } from 'stream';

export const convertWavToOgg = (wavBuffer) => {
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