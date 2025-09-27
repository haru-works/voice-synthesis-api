export const baseOpenApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Voice Synthesis Wrapper API',
    version: '1.0.0',
    description: 'TTS Engine を使用してテキストから音声を合成するAPIラッパー',
  },
  servers: [
    { url: '/', description: 'Current server' }
  ],
  paths: {},
};

export const commonRequestBody = {
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['text', 'speaker'],
        properties: {
          text: {
            type: 'string',
            description: '合成するテキスト',
            example: 'こんにちは、VOICEVOXです。',
          },
          speaker: {
            type: 'integer',
            description: '話者ID (VOICEVOX Engineで利用可能なID)',
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
};

export const commonResponses = {
  '200': {
    description: '成功した音声合成',
    content: {
      'audio/wav': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
  '400': {
    description: '不正なリクエスト',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  '500': {
    description: '内部サーバーエラー',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' },
          },
        },
      },
    },
  },
};
