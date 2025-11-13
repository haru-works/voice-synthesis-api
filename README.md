# Voice Synthesis API

複数のTTS（Text-to-Speech）エンジンを統一されたインターフェースで利用するためのラッパーAPIです。Honoフレームワークをベースに構築されており、OpenAPIによるドキュメント生成、APIキー認証、複数エンジンへの負荷分散（シャーディング）機能などを提供します。

## 特徴

- **複数TTSエンジンのサポート**:
  - VOICEVOX
  - VOICEVOX NEMO
  - COEIROINK
  - AIVIS
- **統一されたAPI**: 各エンジンの差異を吸収し、共通のフォーマットでリクエストが可能です。
- **APIドキュメント**: Swagger UIによるインタラクティブなAPIドキュメントを自動生成します (`/swagger`)。
- **認証**: `Bearer` トークンによるAPIキー認証機能を備えています。
- **負荷分散と冗長化**: 各エンジンで複数のURLを登録し、ヘルスチェックを行いながらリクエストを分散します。
- **音声フォーマット**: 合成された音声は `audio/ogg` 形式で返却されます。

## セットアップ

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v18.x 以上を推奨)
- [FFmpeg](https://ffmpeg.org/) (音声変換のためにシステムにインストールされている必要があります)

### 2. インストール

プロジェクトをクローンし、依存パッケージをインストールします。

```bash
git clone https://github.com/your-username/voice-synthesis-api.git
cd voice-synthesis-api
npm install
```

### 3. 設定

プロジェクトルートに `.env` ファイルを作成し、必要な環境変数を設定します。

```env
# 各TTSエンジンのURL(カンマ区切りで複数指定可)
VOICEVOX_ENGINE_URL="http://localhost:50021,http://localhost:50022,…"
VOICEVOX_NEMO_ENGINE_URL="http://localhost:50121,,http://localhost:50122,…"
AIVIS_SPEECH_ENGINE_URL="http://localhost:10101,http://localhost:10102,…"
COEIROINK_ENGINE_URL="http://localhost:50031,http://localhost:50032,…"

# CORS設定(カンマ区切りで複数指定可)
CORS_ORIGIN="http://localhost1,http://localhost2,…"
CORS_MAX_AGE=600

# APIキー (generate-api-key.jsで生成)
API_KEY=

# サーバーポート
SERVER_PORT=8888

# デフォルト設定 (リトライ時に使用)
DEFAULT_VOICEVOX_SPEAKER_STYLE_ID="2"
DEFAULT_VOICEVOX_ENGINE_URL="http://localhost:50021"
DEFAULT_COEIROINK_SPEAKER_STYLE_ID="0"
DEFAULT_COEIROINK_SPEAKER_UUID="3c37646f-3881-5374-2a83-149267990abc"
DEFAULT_COEIROINK_ENGINE_URL="http://localhost:50031"

# FFmpegのパス (環境に合わせて変更)
# FFMPEG_PATH="/usr/bin/ffmpeg"
FFMPEG_PATH="C:\\FFmpeg\\bin\\ffmpeg.exe"

# ヘルスチェック間隔 (ミリ秒)
HEALTH_CHECK_INTERVAL_MS=180000

# シャーディング設定
NUMBER_OF_SHARDS=3
```

### 4. APIキーの生成

以下のコマンドを実行すると、セキュアなAPIキーが生成され、`.env` ファイルに自動的に追記・更新されます。

```bash
node generate-api-key.js
```

## 実行

以下のコマンドでAPIサーバーを起動します。

```bash
npm start
```

サーバーが起動すると、コンソールに `Voice Synthesis API Server listening on http://...` と表示されます。

## API仕様

### エンドポイント

各TTSエンジンに対応するエンドポイントが用意されています。

- `POST /voice-synthesis-voicevox`
- `POST /voice-synthesis-voicevox-nemo`
- `POST /voice-synthesis-aivis`
- `POST /voice-synthesis-coeiroink`

リクエストボディの詳細は、後述のAPIドキュメントを参照してください。

### 認証

すべてのリクエストには、`Authorization` ヘッダーにAPIキーを含める必要があります。

```
Authorization: Bearer <YOUR_API_KEY>
```

### APIドキュメント (Swagger UI)

サーバー起動後、ブラウザで `/swagger` にアクセスすると、Swagger UIが表示されます。
各エンドポイントの詳細な仕様や、その場でのAPIテストが可能です。

- **URL**: `http://localhost:8888/swagger`

## プロジェクト構成

```
.
├── config/         # OpenAPIのスキーマ定義
├── engine/         # 各TTSエンジンのAPIロジック
├── log/            # アプリケーションログの出力先
├── utils/          # ユーティリティ（ロガー、音声変換など）
├── .env            # 環境変数ファイル
├── generate-api-key.js # APIキー生成スクリプト
├── index.js        # アプリケーションのエントリーポイント
└── package.json    # プロジェクト定義ファイル
```

## 環境変数

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `SERVER_PORT` | APIサーバーがリッスンするポート番号 | `8888` |
| `CORS_ORIGIN` | CORSを許可するオリジン(カンマ区切りで複数指定可) | `http://localhost1,http://localhost2,…` |
| `CORS_MAX_AGE` | `Access-Control-Max-Age` ヘッダーの値（秒） | `600` |
| `API_KEY` | 認証に使用するAPIキー | **必須** |
| `VOICEVOX_ENGINE_URL` | VOICEVOXエンジンのURL(カンマ区切りで複数指定可) | `http://localhost:50021,http://localhost:50022,…` |
| `VOICEVOX_NEMO_ENGINE_URL` | VOICEVOX NEMOエンジンのURL(カンマ区切りで複数指定可) | `http://localhost:50121,http://localhost:50122,…` |
| `AIVIS_SPEECH_ENGINE_URL` | AIVISエンジンのURL(カンマ区切りで複数指定可) | `http://localhost:10101,http://localhost:10101,…` |
| `COEIROINK_ENGINE_URL` | COEIROINKエンジンのURL(カンマ区切りで複数指定可) | `http://localhost:50031,http://localhost:50032,…` |
| `DEFAULT_VOICEVOX_SPEAKER_STYLE_ID` | VOICEVOXのデフォルト話者スタイルID | `2` |
| `DEFAULT_VOICEVOX_ENGINE_URL` | VOICEVOXのデフォルトエンジンURL | `http://localhost:50021` |
| `DEFAULT_COEIROINK_SPEAKER_STYLE_ID` | COEIROINKのデフォルト話者スタイルID | `0` |
| `DEFAULT_COEIROINK_SPEAKER_UUID` | COEIROINKのデフォルト話者UUID | `3c37646f-3881-5374-2a83-149267990abc` |
| `DEFAULT_COEIROINK_ENGINE_URL` | COEIROINKのデフォルトエンジンURL | `http://localhost:50031` |
| `FFMPEG_PATH` | FFmpeg実行ファイルのパス | `C:\FFmpeg\bin\ffmpeg.exe` |
| `HEALTH_CHECK_INTERVAL_MS` | エンジンのヘルスチェックを行う間隔（ミリ秒） | `180000` |
| `NUMBER_OF_SHARDS` | 話者情報を分割するシャードの数 | `3` |