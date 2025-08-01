# Beds24→清掃シフト自動化システム

Beds24 APIから予約データを自動取得し、Googleスプレッドシートで清掃シフトを管理するシステムのモックアップです。

## 📁 プロジェクト構成

```
20250801cleaning_schedule/
├── index.html              # メインHTMLファイル
├── css/
│   └── styles.css          # スタイルシート
├── js/
│   └── app.js              # JavaScriptファイル
├── pages/
│   ├── calendar.html       # 部屋稼働カレンダー画面
│   ├── schedule.html       # 清掃スケジュール詳細画面
│   └── staff.html          # スタッフ基本情報画面
├── gas/
│   └── Code.gs             # Google Apps Scriptファイル
├── backup/
│   └── cleaning_schedule_mockup.html  # 元のHTMLファイル
└── README.md               # このファイル
```

## 🚀 機能

### 1. 部屋稼働 & 清掃シフト
- 週間カレンダーで宿泊状況を可視化
- チェックアウト後の清掃担当者を自動割り当て
- 同日チェックアウト・チェックインの処理
- 連泊客の清掃要否を視覚的に区別
- 部屋別の稼働状況を一目で確認

### 2. 清掃スケジュール詳細
- スタッフ別の清掃予定を時系列で表示
- チェックアウト清掃と連泊客清掃の両方を管理
- 勤務時間と清掃予定の整合性を確認
- 時間的重複を避けたタスク割り当て
- 空き時間の把握

### 3. スタッフ基本情報
- 清掃スタッフの勤務時間・連絡先管理
- シフト自動割り当ての基礎データ

## 🛠️ セットアップ手順

### 1. HTMLファイルの確認
```bash
# メインページを開く
open index.html
```

### 2. Google Apps Scriptの設定

1. [Google Apps Script](https://script.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. `gas/Code.gs`の内容をコピー&ペースト
4. 以下の設定を実際の値に変更：

```javascript
const CONFIG = {
  BEDS24_AUTHENTICATION_TOKEN: 'YOUR_AUTH_TOKEN', // Beds24の認証トークン
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',         // GoogleスプレッドシートのID
  PROPERTY_ID: 'YOUR_PROPERTY_ID'                // Beds24のプロパティID
};
```

### 3. Googleスプレッドシートの準備

以下のシートを作成：
- `部屋稼働カレンダー`
- `清掃スケジュール`
- `スタッフ基本情報`

### 4. 定期実行の設定

Google Apps Scriptで以下のトリガーを設定：
- 関数: `dailyUpdate`
- 実行頻度: 毎日
- 時刻: 午前9時

## 📋 使用方法

### 手動実行
```javascript
// Google Apps Scriptで実行
manualUpdate();
```

### 自動実行
- 設定したトリガーにより毎日自動実行
- Beds24から最新の予約データを取得
- スプレッドシートを自動更新

## 🔧 カスタマイズ

### 部屋番号の変更
`gas/Code.gs`の`rooms`配列を編集：
```javascript
const rooms = ['101', '102', '201', '202', '301']; // 実際の部屋番号に変更
```

### スタッフ情報の変更
`gas/Code.gs`の`staff`配列を編集：

## 🆕 新機能

### 同日チェックアウト・チェックイン対応
- 同じ日にチェックアウトとチェックインがある場合、両方の情報を表示
- 清掃時間を考慮したスケジュール調整

### 連泊客清掃管理
- 3日以上の連泊客に対して、2日目以降に清掃を割り当て
- 「宿泊中(清掃要)」として視覚的に区別
- 専用の清掃スタッフを割り当て

### 時間的重複防止
- 同一スタッフの同時作業を防止
- 1.5時間/タスクの標準時間でスケジュール調整
- 効率的な作業時間の配分
```javascript
const staff = [
  { name: '田中太郎', workDays: ['月', '火', '水', '木', '金'], startTime: '09:00', endTime: '17:00' },
  // 実際のスタッフ情報に変更
];
```

## 📝 注意事項

- このシステムはモックアップです
- 実際の運用にはBeds24 APIの認証情報が必要です
- スプレッドシートのIDは実際のものに変更してください
- エラーハンドリングは簡易的な実装です

## 🔗 関連リンク

- [Beds24 API Documentation](https://api.beds24.com/)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)

## 📞 サポート

ご質問やカスタマイズのご相談は、プロジェクトの管理者までお問い合わせください。 