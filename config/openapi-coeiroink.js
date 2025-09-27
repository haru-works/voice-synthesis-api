import { commonResponses } from './openapi-base.js';

export const coeiroinkOpenApi = {
  '/voice-synthesis-coeiroink': {
    post: {
      summary: 'テキストから音声を合成 (COEIROINK Engine)',
      description: '指定されたテキストと話者IDでCOEIROINK Engineを呼び出し、音声データを返します。',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text', 'speaker', 'speakerUuid'],
              properties: {
                text: {
                  type: 'string',
                  description: '合成するテキスト',
                  example: 'こんにちは、COEIROINKです。',
                },
                speaker: {
                  type: 'integer',
                  description: 'スタイルID (COEIROINK Engineで利用可能なID)',
                  example: 0,
                },
                speakerUuid: {
                  type: 'string',
                  description: '話者UUID',
                  example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                },
                speedScale: {
                  type: 'number',
                  format: 'float',
                  description: '話速',
                  example: 1.0,
                },
                pitchScale: {
                  type: 'number',
                  format: 'float',
                  description: '音高',
                  example: 0.0,
                },
                intonationScale: {
                  type: 'number',
                  format: 'float',
                  description: '抑揚',
                  example: 1.0,
                },
                volumeScale: {
                  type: 'number',
                  format: 'float',
                  description: '音量',
                  example: 1.0,
                },
                prePhonemeLength: {
                  type: 'number',
                  format: 'float',
                  description: '音声の前の無音時間',
                  example: 0.0,
                },
                postPhonemeLength: {
                  type: 'number',
                  format: 'float',
                  description: '音声の後の無音時間',
                  example: 0.0,
                },
                outputSamplingRate: {
                  type: 'integer',
                  description: '出力音声のサンプリングレート',
                  example: 24000,
                },
                outputStereo: {
                  type: 'boolean',
                  description: '出力音声のステレオ化',
                  example: true,
                },
              },
            },
          },
        },
      },
      responses: commonResponses,
    },
  },
};
