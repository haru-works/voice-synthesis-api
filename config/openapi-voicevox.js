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
  '/voice-synthesis-voicevox/speakers/sharded': {
    get: {
      summary: 'シャーディングされたスピーカー情報を取得',
      description: 'VOICEVOXエンジンのシャーディングされたスピーカー情報（スタイルID、スタイル名、話者UUID、話者名、エンジンURL）の配列を返します。',
      responses: {
        200: {
          description: '成功',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    engineUrl: {
                      type: 'string',
                      description: 'このシャードが使用するVOICEVOXエンジンのURL',
                    },
                    styles: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          style_id: {
                            type: 'integer',
                            description: 'スピーカーのスタイルID',
                          },
                          style_name: {
                            type: 'string',
                            description: 'スピーカーのスタイル名',
                          },
                          speaker_uuid: {
                            type: 'string',
                            description: 'スピーカーのUUID',
                          },
                          speaker_name: {
                            type: 'string',
                            description: 'スピーカーの名前',
                          },
                          engineUrl: {
                            type: 'string',
                            description: 'このスタイルが割り当てられているVOICEVOXエンジンのURL',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        500: {
          description: '内部サーバーエラー',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    description: 'エラーメッセージ',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
