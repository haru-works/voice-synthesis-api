import { commonRequestBody, commonResponses } from './openapi-base.js';

export const voicevoxOpenApi = {
  '/voice-synthesis-voicevox': {
    post: {
      summary: 'テキストから音声を合成',
      description: '指定されたテキストと話者IDでVOICEVOX Engineを呼び出し、音声データを返します。',
      requestBody: commonRequestBody,
      responses: commonResponses,
    },
  },
};
