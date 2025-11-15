import axios from 'axios';
import { Hono } from 'hono';
import { convertWavToOggWithWorker } from '../utils/audioConverterWorker.js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { logInfo, logError, logWarn } from '../utils/logger.js';

// 環境変数を読み込む
const HEALTH_CHECK_INTERVAL_MS = process.env.HEALTH_CHECK_INTERVAL_MS ? parseInt(process.env.HEALTH_CHECK_INTERVAL_MS, 10) : 60000;
const NUMBER_OF_SHARDS = process.env.NUMBER_OF_SHARDS;

// エンジンURLのヘルス状態を管理するMap
const engineHealthStatus = new Map(); // Map<string, boolean> (URL -> isHealthy)

// 共通のZodスキーマ
export const synthesisSchema = z.object({
  text: z.string().min(1, 'textは必須です。'),
  speaker: z.number().int().min(0, 'speakerは0以上の整数である必要があります。'),
  speakerUuid: z.string().optional(),
  speedScale: z.number().min(0.5).max(3.0).optional(),
  pitchScale: z.number().min(-0.25).max(0.25).optional(),
  intonationScale: z.number().min(-5.0).max(5.0).optional(),
  volumeScale: z.number().min(0.1).max(5.0).optional(),
  prePhonemeLength: z.number().min(0).max(1).optional(),
  postPhonemeLength: z.number().min(0).max(1).optional(),
  outputSamplingRate: z.number().int().positive().optional(),
  outputStereo: z.boolean().optional(),
});

/**
 * エンジンのヘルスチェックを実行する関数
 * @param {string} url - チェックするエンジンURL
 * @param {string} speakersPath - スピーカー情報取得APIのパス
 * @param {string} engineName - エンジン名 (ログ出力用)
 * @returns {Promise<boolean>} ヘルスチェックが成功したかどうか
 */
async function checkEngineHealth(url, speakersPath, engineName) {
  try {
    await axios.get(`${url}${speakersPath}`, { timeout: 3000 }); // 短いタイムアウトでヘルスチェック
    logInfo(`Engine ${engineName} at ${url} is healthy.`);
    return true;
  } catch (error) {
    logError(`Engine ${engineName} at ${url} is unhealthy:`, error.message);
    return false;
  }
}

/**
 * スピーカー情報を初期化し、シャーディングする共通関数
 * @param {string[]} engineUrls - エンジンURLの配列
 * @param {string} engineName - エンジン名 (ログ出力用)
 * @param {string} speakersPath - スピーカー情報取得APIのパス (例: '/speakers', '/v1/speakers')
 * @returns {Promise<Array>} シャーディングされたスピーカー情報の配列
 */
export async function initializeEngineSpeakers(engineUrls, engineName, speakersPath) {
  if (engineUrls.length === 0) {
    logWarn(`${engineName}_ENGINE_URLSが設定されていません。`);
    return [];
  }

  const uniqueSpeakerStylesMap = new Map();
  await Promise.all(engineUrls.map(async (url) => {
    const isHealthy = await checkEngineHealth(url, speakersPath, engineName);
    engineHealthStatus.set(url, isHealthy);

    if (isHealthy) {
      try {
        const speakersResponse = await axios.get(`${url}${speakersPath}`, { timeout: 5000 });
        speakersResponse.data.forEach(speaker => {
          if (engineName === 'COEIROINK') {
            // COEIROINK specific mapping
            speaker.styles.forEach(style => {
              uniqueSpeakerStylesMap.set(style.styleId, {
                style_id: style.styleId,
                style_name: style.styleName,
                speaker_uuid: speaker.speakerUuid,
                speaker_name: speaker.speakerName,
              });
            });
          } else {
            // For other engines
            speaker.styles.forEach(style => {
              uniqueSpeakerStylesMap.set(style.id, {
                style_id: style.id,
                style_name: style.name,
                speaker_uuid: speaker.speaker_uuid,
                speaker_name: speaker.name,
              });
            });
          }
        });
      } catch (error) {
        logError(`Failed to fetch speakers from ${url} for ${engineName}:`, error.message);
        engineHealthStatus.set(url, false); // スピーカー取得失敗時も不健康とマーク
      }
    }
  }));

  const allSpeakerStylesFlattened = Array.from(uniqueSpeakerStylesMap.values());
  allSpeakerStylesFlattened.sort((a, b) => a.style_id - b.style_id);

  const tempThreeShardedStyles = Array.from({ length: NUMBER_OF_SHARDS }, () => []);
  const stylesPerThreeShard = Math.ceil(allSpeakerStylesFlattened.length / NUMBER_OF_SHARDS);

  for (let i = 0; i < allSpeakerStylesFlattened.length; i++) {
    const shardIndex = Math.floor(i / stylesPerThreeShard);
    if (shardIndex < NUMBER_OF_SHARDS) {
      tempThreeShardedStyles[shardIndex].push(allSpeakerStylesFlattened[i]);
    }
  }

  const shardedSpeakerStyles = [];
  if (engineUrls.length < NUMBER_OF_SHARDS) {
    logWarn(`${engineName}_ENGINE_URLSの数が${NUMBER_OF_SHARDS}未満です。最初の${engineUrls.length}つのURLにシャードを割り当てます。`);
  }

  for (let i = 0; i < NUMBER_OF_SHARDS; i++) {    const engineUrl = engineUrls[i] || engineUrls[0];
    shardedSpeakerStyles.push({
      shardIndex: i,
      engineUrl: engineUrl,
      engineName: engineName,
      styles: tempThreeShardedStyles[i].map(style => ({
        style_id: style.style_id,
        style_name: style.style_name,
        speaker_uuid: style.speaker_uuid,
        speaker_name: style.speaker_name,
        engineUrl: engineUrl,
        shardIndex: i
      }))
    });
  }



  logInfo(`${engineName}エンジンの初期化が完了しました。シャード情報:`, shardedSpeakerStyles);
  return shardedSpeakerStyles;
}

/**
 * 各エンジンのルーターを作成する共通関数
 * @param {object} options - オプションオブジェクト
 * @param {string[]} options.engineUrls - エンジンURLの配列
 * @param {string} options.engineName - エンジン名 (ログ出力用)
 * @param {string} options.speakersPath - スピーカー情報取得APIのパス
 * @param {string} options.synthesisPath - 音声合成APIのパス
 * @param {string} options.audioQueryPath - オーディオクエリAPIのパス (COEIROINK以外)
 * @param {string} options.defaultSpeakerStyleId - デフォルトスピーカーID
 * @param {string} options.defaultSpeakerUuid - デフォルトスピーカーUUID (COEIROINKのみ)
 * @param {string} options.defaultEngineUrl - デフォルトエンジンURL
 * @returns {Hono} Honoルーター
 */
export function createEngineRouter({
  engineUrls,
  engineName,
  speakersPath,
  synthesisPath,
  audioQueryPath,
  defaultSpeakerStyleId,
  defaultSpeakerUuid,
  defaultEngineUrl,
}) {
  const router = new Hono();
  let shardedSpeakerStyles = [];

  // アプリケーション起動時に初期化関数を実行
  initializeEngineSpeakers(engineUrls, engineName, speakersPath)
    .then(data => { shardedSpeakerStyles = data; })
    .catch(logError);

  // 定期的なヘルスチェック
  setInterval(async () => {
    for (const url of engineUrls) {
      const isHealthy = await checkEngineHealth(url, speakersPath, engineName);
      engineHealthStatus.set(url, isHealthy);
    }
  }, HEALTH_CHECK_INTERVAL_MS); // .envで設定されたインターバル、デフォルトは30秒

  router.get('/speakers/sharded', (c) => {
    return c.json(shardedSpeakerStyles);
  });

  router.post('/', zValidator('json', synthesisSchema), async (c) => {
    try {
      const requestBody = c.req.valid('json');
      let { text, speaker, speakerUuid, speedScale, pitchScale, intonationScale, volumeScale, prePhonemeLength, postPhonemeLength, outputSamplingRate, outputStereo } = requestBody;

      // ヘルシーなエンジンURLのみをフィルタリング
      const healthyEngineUrls = engineUrls.filter(url => engineHealthStatus.get(url));
      if (healthyEngineUrls.length === 0) {
        return c.json({ error: '利用可能な音声合成エンジンがありません。' }, 503);
      }

      let selectedEngineUrl = healthyEngineUrls[0]; // デフォルトは最初のヘルシーなエンジンURL
      let selectedShardIndex = -1; // ログ出力用に選択されたシャードのインデックスを保持

      // シャーディングされた情報から適切なエンジンURLを検索
      for (let i = 0; i < shardedSpeakerStyles.length; i++) {
        const shard = shardedSpeakerStyles[i];
        const foundStyle = shard.styles.find(style => style.style_id === speaker);
        if (foundStyle && engineHealthStatus.get(foundStyle.engineUrl)) { // ヘルシーなエンジンのみを選択
          selectedEngineUrl = foundStyle.engineUrl;
          selectedShardIndex = i;
          break;
        }
      }

      logInfo(`Processing synthesis request for speaker ${speaker} with engineName ${engineName} engine ${selectedEngineUrl} (Shard ${selectedShardIndex})`);

      const synthesisRequestBody = {
        speedScale: speedScale,
        pitchScale: pitchScale,
        intonationScale: intonationScale,
        volumeScale: volumeScale,
        prePhonemeLength: prePhonemeLength,
        postPhonemeLength: postPhonemeLength,
        outputSamplingRate: outputSamplingRate,
        outputStereo: outputStereo || false,
      };

      // COEIROINK固有の処理
      if (engineName === 'COEIROINK') {
        Object.assign(synthesisRequestBody, {
          speakerUuid: speakerUuid,
          styleId: speaker,
          text: text,
        });
      }

      let audioBuffer;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          if (audioQueryPath) { // COEIROINK以外
            // 1. /audio_query APIの呼び出し
            const audioQueryUrl = `${selectedEngineUrl}${audioQueryPath}`;
            const audioQueryResponse = await axios.post(
              `${audioQueryUrl}?text=${encodeURIComponent(text)}&speaker=${speaker}`,
              null,
              {
                headers: { 'accept': 'application/json' },
                timeout: 10000,
              }
            );
            const audioQuery = audioQueryResponse.data;

            // 2. /synthesis APIの呼び出し
            const synthesisUrl = `${selectedEngineUrl}${synthesisPath}`;
            const synthesisResponse = await axios.post(
              `${synthesisUrl}?speaker=${speaker}`,
              JSON.stringify({ ...audioQuery, ...synthesisRequestBody }),
              {
                responseType: 'arraybuffer',
                headers: { 'Content-Type': 'application/json', 'accept': 'audio/wav' },
                timeout: 10000,
              }
            );
            audioBuffer = synthesisResponse.data;
          } else { // COEIROINK
            const synthesisUrl = `${selectedEngineUrl}${synthesisPath}`;
            const synthesisResponse = await axios.post(
              synthesisUrl,
              JSON.stringify(synthesisRequestBody),
              {
                responseType: 'arraybuffer',
                headers: { 'Content-Type': 'application/json', 'accept': 'audio/wav' },
                timeout: 10000,
              }
            );
            audioBuffer = synthesisResponse.data;
          }
          break;

        } catch (error) {
          logError(`Attempt ${attempts + 1} failed for speaker ${speaker} with engine ${selectedEngineUrl} (Shard ${selectedShardIndex}) (${engineName}):`, error.message);
          if (attempts === 0) {
            logWarn('Synthesis failed, retrying with default speaker.');
            speaker = defaultSpeakerStyleId;
            selectedEngineUrl = defaultEngineUrl;
            selectedShardIndex = -1; // デフォルトエンジンに切り替わったため、シャードインデックスをリセット
            if (engineName === 'COEIROINK') {
              speakerUuid = defaultSpeakerUuid;
              synthesisRequestBody.styleId = speaker;
              synthesisRequestBody.speakerUuid = speakerUuid;
            }
            attempts++;
          } else {
            throw error;
          }
        }
      }

      const oggBuffer = await convertWavToOggWithWorker(audioBuffer);

      return new Response(oggBuffer, {
        headers: {
          'Content-Type': 'audio/ogg',
          'Content-Length': oggBuffer.byteLength.toString(),
        },
      });

    } catch (error) {
      logError(`An error occurred in ${engineName} engine:`, error.message);
      if (error.response) {
        logError('External API response error:', error.response.status, error.response.data);
        return c.json({ error: `音声合成サービスで問題が発生しました。` }, error.response.status);
      } else if (error.request) {
        return c.json({ error: '音声合成サービスからの応答がありません。' }, 500);
      } else {
        return c.json({ error: '内部サーバーエラーが発生しました。' }, 500);
      }
    }
  });

  return router;
}
