import { commonRequestBody, commonResponses } from './openapi-base.js';

export const voicevoxNemoOpenApi = {
  '/voice-synthesis-voicevox-nemo': {
    post: {
      summary: 'テキストから音声を合成 (NEMO Engine)',
      description: '指定されたテキストと話者IDでVOICEVOX NEMO Engineを呼び出し、音声データを返します。',
      requestBody: commonRequestBody,
      responses: commonResponses,
    },
  },
};
