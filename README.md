# Google Search Operator Generator

フォームから条件を選び、Google検索コマンドを生成できる静的Webツールです。

## 機能

- 完全一致、除外、OR検索
- `site:`、`filetype:`、`intitle:`、`inurl:`、`intext:`、`related:`
- `after:`、`before:`による期間指定
- 検索コマンドのコピーとGoogle検索
- よく使う条件のプリセット

外部APIや外部ライブラリは使用していません。

## デプロイ

Cloudflare PagesでGitHubリポジトリと連携して公開します。

- Production branch: `main`
- Framework preset: `None`
- Build command: 空欄
- Build output directory: `/`
