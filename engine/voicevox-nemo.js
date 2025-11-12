import { createEngineRouter } from './common.js';

const VOICEVOX_NEMO_ENGINE_URLS = process.env.VOICEVOX_NEMO_ENGINE_URL ? process.env.VOICEVOX_NEMO_ENGINE_URL.split(',') : [];
const DEFAULT_SPEAKER_STYLE_ID = process.env.DEFAULT_VOICEVOX_NEMO_SPEAKER_STYLE_ID || "2"; // VOICEVOX NEMO固有のデフォルト値に修正
const DEFAULT_ENGINE_URL = process.env.DEFAULT_VOICEVOX_NEMO_ENGINE_URL || "http://localhost:50021"; // VOICEVOX NEMO固有のデフォルト値に修正

export const voicevoxNemoRouter = createEngineRouter({
  engineUrls: VOICEVOX_NEMO_ENGINE_URLS,
  engineName: 'VOICEVOX NEMO',
  speakersPath: '/speakers',
  synthesisPath: '/synthesis',
  audioQueryPath: '/audio_query',
  defaultSpeakerStyleId: DEFAULT_SPEAKER_STYLE_ID,
  defaultEngineUrl: DEFAULT_ENGINE_URL,
});