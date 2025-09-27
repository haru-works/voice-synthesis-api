import { commonRequestBody, commonResponses } from './openapi-base.js';

export const aivisOpenApi = {
  '/voice-synthesis-aivis': {
    post: {
      summary: 'テキストから音声を合成 (AIVIS Speech Engine)',
      description: '指定されたテキストと話者IDでAIVIS Speech Engineを呼び出し、音声データを返します。',
      requestBody: commonRequestBody,
      responses: commonResponses,
    },
  },
};
