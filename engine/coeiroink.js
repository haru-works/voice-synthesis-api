import axios from 'axios';
import { Hono } from 'hono';
import { convertWavToOgg } from '../utils/audioConverter.js';

const COEIROINK_ENGINE_URL = process.env.COEIROINK_ENGINE_URL;

export const coeiroinkRouter = new Hono();

coeiroinkRouter.post('/', async (c) => {
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
      speakerUuid: speakerUuid,
      styleId: speaker,
      text: text,
      speedScale: speedScale,
      pitchScale: pitchScale,
      intonationScale: intonationScale,
      volumeScale: volumeScale,
      prePhonemeLength: prePhonemeLength,
      postPhonemeLength: postPhonemeLength,
      outputSamplingRate: outputSamplingRate,
      outputStereo: outputStereo || false,
    };

    const synthesisResponse = await axios.post(
      `${COEIROINK_ENGINE_URL}/v1/synthesis`,
      JSON.stringify(synthesisRequestBody),
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'audio/wav',
        },
      }
    );

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
      const errorDetails = error.response.data ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data.toString()) : error.message;
      return c.json({ error: `External API error: ${error.response.status}`, details: errorDetails }, error.response.status);
    } else if (error.request) {
      return c.json({ error: 'No response received from external API', details: error.message }, 500);
    } else {
      return c.json({ error: 'Internal server error', details: error.message }, 500);
    }
  }
});
