import { createEngineRouter } from './common.js';

const COEIROINK_ENGINE_URLS = process.env.COEIROINK_ENGINE_URL ? process.env.COEIROINK_ENGINE_URL.split(',') : [];
const DEFAULT_SPEAKER_STYLE_ID = process.env.DEFAULT_COEIROINK_SPEAKER_STYLE_ID || "0";
const DEFAULT_SPEAKER_UUID = process.env.DEFAULT_COEIROINK_SPEAKER_UUID || "3c37646f-3881-5374-2a83-149267990abc";
const DEFAULT_ENGINE_URL = process.env.DEFAULT_COEIROINK_ENGINE_URL || "http://localhost:50031";

export const coeiroinkRouter = createEngineRouter({
  engineUrls: COEIROINK_ENGINE_URLS,
  engineName: 'COEIROINK',
  speakersPath: '/v1/speakers',
  synthesisPath: '/v1/synthesis',
  audioQueryPath: null, // COEIROINKはaudio_queryがない
  defaultSpeakerStyleId: DEFAULT_SPEAKER_STYLE_ID,
  defaultSpeakerUuid: DEFAULT_SPEAKER_UUID,
  defaultEngineUrl: DEFAULT_ENGINE_URL,
});