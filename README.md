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
# サーバー設定
SERVER_PORT=8888

# CORS設定 (カンマ区切りで複数指定可)
CORS_ORIGIN=http://localhost:3000,https://example.com
CORS_MAX_AGE=600

# APIキー (次のステップで生成)
API_KEY=

# 各TTSエンジンのURL (カンマ区切りで複数指定可)
VOICEVOX_ENGINE_URLS=http://localhost:50021
VOICEVOX_NEMO_ENGINE_URLS=http://localhost:50022
AIVIS_ENGINE_URLS=http://localhost:50023
COEIROINK_ENGINE_URLS=http://localhost:50031

# シャーディング設定 (通常は変更不要)
NUMBER_OF_SHARDS=3

# ヘルスチェック間隔 (ミリ秒)
HEALTH_CHECK_INTERVAL_MS=60000
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

| 変数名 | 説明 | デフォルト値 |
| --- | --- | --- |
| `SERVER_PORT` | APIサーバーがリッスンするポート番号 | `8888` |
| `CORS_ORIGIN` | CORSを許可するオリジンのリスト（カンマ区切り） | `[]` |
| `CORS_MAX_AGE` | `Access-Control-Max-Age` ヘッダーの値（秒） | `600` |
| `API_KEY` | 認証に使用するAPIキー | **必須** |
| `VOICEVOX_ENGINE_URLS` | VOICEVOXエンジンのURLリスト（カンマ区切り） | |
| `VOICEVOX_NEMO_ENGINE_URLS` | VOICEVOX NEMOエンジンのURLリスト（カンマ区切り） | |
| `AIVIS_ENGINE_URLS` | AIVISエンジンのURLリスト（カンマ区切り） | |
| `COEIROINK_ENGINE_URLS` | COEIROINKエンジンのURLリスト（カンマ区切り） | |
| `NUMBER_OF_SHARDS` | 話者情報を分割するシャードの数 | `3` |
| `HEALTH_CHECK_INTERVAL_MS` | エンジンのヘルスチェックを行う間隔（ミリ秒） | `60000` |