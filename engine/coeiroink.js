import axios from 'axios';
import { Hono } from 'hono';
import { convertWavToOggWithWorker } from '../utils/audioConverterWorker.js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const COEIROINK_ENGINE_URL = process.env.COEIROINK_ENGINE_URL;

export const coeiroinkRouter = new Hono();

const synthesisSchema = z.object({
  text: z.string().min(1, 'textは必須です。'),
  speaker: z.number().int().min(0, 'speakerは0以上の整数である必要があります。'),
  speakerUuid: z.string().uuid('speakerUuidは有効なUUIDである必要があります。').optional(),
  speedScale: z.number().min(0).max(2).optional(),
  pitchScale: z.number().min(-0.5).max(0.5).optional(),
  intonationScale: z.number().min(0).max(2).optional(),
  volumeScale: z.number().min(0).max(2).optional(),
  prePhonemeLength: z.number().min(0).max(1).optional(),
  postPhonemeLength: z.number().min(0).max(1).optional(),
  outputSamplingRate: z.number().int().positive().optional(),
  outputStereo: z.boolean().optional(),
});

coeiroinkRouter.post('/', zValidator('json', synthesisSchema), async (c) => {
  try {
    const requestBody = c.req.valid('json');
    const { text, speaker, speakerUuid, speedScale, pitchScale, intonationScale, volumeScale, prePhonemeLength, postPhonemeLength, outputSamplingRate, outputStereo } = requestBody;

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
        timeout: 10000, // 10秒のタイムアウト
      }
    );

    const audioBuffer = synthesisResponse.data;

    // WAVをOGGに変換 (ワーカーを使用)
    const oggBuffer = await convertWavToOggWithWorker(audioBuffer);

    return new Response(oggBuffer, {
      headers: {
        'Content-Type': 'audio/ogg',
        'Content-Length': oggBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('An error occurred in COEIROINK engine:', error.message);
    if (error.response) {
      // Axiosのエラーレスポンスがある場合
      // 外部APIからの詳細なエラーはログに記録し、クライアントには一般的なメッセージを返す
      console.error('External API response error:', error.response.status, error.response.data);
      return c.json({ error: `音声合成サービスで問題が発生しました。` }, error.response.status);
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがなかった場合
      return c.json({ error: '音声合成サービスからの応答がありません。' }, 500);
    } else {
      // その他のエラー
      return c.json({ error: '内部サーバーエラーが発生しました。' }, 500);
    }
  }
});
