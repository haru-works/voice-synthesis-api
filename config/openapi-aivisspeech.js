import { commonRequestBody, commonResponses } from './openapi-base.js';

export const aivisOpenApi = {
  '/voice-synthesis-aivisspeech': {
    post: {
      summary: 'テキストから音声を合成 (AivsSpeech Engine)',
      description: '指定されたテキストと話者IDでAivisSpeech Engineを呼び出し、音声データを返します。',
      requestBody: commonRequestBody,
      responses: commonResponses,
    },
  },
};
