import axios from 'axios';
import { Hono } from 'hono';
import { convertWavToOgg } from '../utils/audioConverter.js';

const AIVIS_SPEECH_ENGINE_URL = process.env.AIVIS_SPEECH_ENGINE_URL;

export const aivisRouter = new Hono();

aivisRouter.post('/', async (c) => {
  try {
    const requestBody = await c.req.json();
    const { text, speaker, speakerUuid, speedScale, pitchScale, intonationScale, volumeScale, prePhonemeLength, postPhonemeLength, outputSamplingRate, outputStereo } = requestBody;

    if (text == null) {
        return c.json({ error: 'text未設定' }, 400);
    }

    if (speaker == null) {
        return c.json({ error: 'speaker未設定' }, 400);
    }

    if (speakerUuid == null) {
        return c.json({ error: 'speakerUuid未設定' }, 400);
    }

    const synthesisRequestBody = {
      speedScale: speedScale,
      pitchScale: pitchScale,
      intonationScale: intonationScale,
      volumeScale: volumeScale,
      prePhonemeLength: prePhonemeLength,
      postPhonemeLength: postPhonemeLength,
      outputSamplingRate: outputSamplingRate,
      outputStereo: outputStereo || false,
    };

    // 1. /audio_query APIの呼び出し
    const audioQueryUrl = `${AIVIS_SPEECH_ENGINE_URL}/audio_query`;
    const audioQueryResponse = await axios.post(
      `${audioQueryUrl}?text=${encodeURIComponent(text)}&speaker=${speaker}`,
      null, // POSTボディはなし
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );
    const audioQuery = audioQueryResponse.data;

    // 2. /synthesis APIの呼び出し
    const synthesisUrl = `${AIVIS_SPEECH_ENGINE_URL}/synthesis`;
    const synthesisResponse = await axios.post(
      `${synthesisUrl}?speaker=${speaker}`,
      JSON.stringify({ ...audioQuery, ...synthesisRequestBody }),
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'audio/wav',
        },
      }
    );

    // 3. 音声データのバイナリをレスポンスとして返す
    const audioBuffer = synthesisResponse.data;

    // WAVをOGGに変換
    const oggBuffer = await convertWavToOgg(audioBuffer);

    return new Response(oggBuffer, {
      headers: {
        'Content-Type': 'audio/ogg',
        'Content-Length': oggBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('An error occurred:', error);
    if (error.response) {
      // Axiosのエラーレスポンスがある場合
      const errorDetails = error.response.data ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data.toString()) : error.message;
      return c.json({ error: `External API error: ${error.response.status}`, details: errorDetails }, error.response.status);
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがなかった場合
      return c.json({ error: 'No response received from external API', details: error.message }, 500);
    } else {
      // その他のエラー
      return c.json({ error: 'Internal server error', details: error.message }, 500);
    }
  }
});
