import { createEngineRouter } from './common.js';

const AIVIS_SPEECH_ENGINE_URLS = process.env.AIVIS_SPEECH_ENGINE_URL ? process.env.AIVIS_SPEECH_ENGINE_URL.split(',') : [];
const DEFAULT_SPEAKER_STYLE_ID = process.env.DEFAULT_VOICEVOX_SPEAKER_STYLE_ID || "2";
const DEFAULT_ENGINE_URL = process.env.DEFAULT_VOICEVOX_ENGINE_URL || "http://localhost:50021";

export const aivisSpeechRouter = createEngineRouter({
  engineUrls: AIVIS_SPEECH_ENGINE_URLS,
  engineName: 'AivisSpeech',
  speakersPath: '/speakers',
  synthesisPath: '/synthesis',
  audioQueryPath: '/audio_query',
  defaultSpeakerStyleId: DEFAULT_SPEAKER_STYLE_ID,
  defaultEngineUrl: DEFAULT_ENGINE_URL,
});