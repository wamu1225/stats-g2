// 検定・分布の使い分けガイド（早見表）の本文。
// prerender.ts（静的HTML＝クローラー用）と App.tsx（クライアント描画）の両方から
// import する単一ソース。base は '/stats-g2' または '' を渡す。
export function buildUsecaseHtml(base: string): string {
  const wrapOpen = '<div style="overflow-x:auto;margin:8px 0 20px"><table style="border-collapse:collapse;width:100%;min-width:520px">';
  const wrapClose = '</table></div>';
  const th = (t: string) => `<th style="text-align:left;padding:8px 10px;background:#eff6ff;border:1px solid #bfdbfe;font-size:0.9rem;white-space:nowrap">${t}</th>`;
  const td = (t: string) => `<td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:0.9rem;color:#444">${t}</td>`;
  const lk = (id: string, label: string) => `<a href="${base}/${id}/" style="color:#2563eb;text-decoration:none">${label}</a>`;
  const row = (cells: string[]) => `<tr>${cells.map(td).join('')}</tr>`;
  return `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${base}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">検定・分布の使い分けガイド</h1>
  <p style="color:#555;margin-bottom:24px">統計検定2級の範囲で「このデータ・この問いには、どの分布／どの検定／どの手法を使うか」を状況から逆引きできる早見表です。各行は本サイトの対応モジュールにリンクしています。個別の解説はリンク先で、ここでは<strong>全体を見渡して手法を選ぶ視点</strong>を整理します。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">1. 確率分布の選び方</h2>
  <p style="color:#444;margin-bottom:4px">「どんな現象か」から、当てはめる確率分布を選びます。</p>
  ${wrapOpen}<thead><tr>${th('状況・知りたいこと')}${th('使う分布')}${th('参照')}</tr></thead><tbody>
  ${row(['n回の独立試行での成功回数', '二項分布', lk('3.1-discrete','3.1')])}
  ${row(['一定の時間・面積あたりに起きる稀な事象の件数', 'ポアソン分布', lk('3.1-discrete','3.1')])}
  ${row(['連続量で左右対称・釣鐘型に分布する量', '正規分布', lk('3.2-continuous','3.2')])}
  ${row(['標本平均がしたがう分布（大標本）', '正規分布（中心極限定理）', lk('3.4-sampling-distribution','3.4')])}
  ${row(['母分散が未知のときの平均の推測', 't分布', lk('3.4-sampling-distribution','3.4')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">2. 推定・検定の選び方（目的別）</h2>
  <p style="color:#444;margin-bottom:4px">「何を確かめたいか」から手法を選びます。</p>
  ${wrapOpen}<thead><tr>${th('知りたいこと')}${th('使う手法')}${th('参照')}</tr></thead><tbody>
  ${row(['母平均・母比率を区間で見積もりたい', '区間推定', lk('4.1-estimation','4.1')])}
  ${row(['1群の平均が基準値と異なるか', '1標本の仮説検定', lk('4.2-testing','4.2')])}
  ${row(['2群の平均・比率に差があるか', '2標本の推定・検定', lk('4.4-two-sample','4.4')])}
  ${row(['3群以上の平均に差があるか', '分散分析（ANOVA）', lk('5.4-anova','5.4')])}
  ${row(['カテゴリ間の関連・適合度を調べる', 'カイ二乗検定', lk('5.2-chi2-test','5.2')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">3. 関係・変化を調べる手法</h2>
  <p style="color:#444;margin-bottom:4px">変数どうしの関係や時間変化を分析します。</p>
  ${wrapOpen}<thead><tr>${th('目的')}${th('使う手法')}${th('参照')}</tr></thead><tbody>
  ${row(['2変数の関係の強さ・向きを見る', '相関・散布図', lk('1.3-standardization','1.3')])}
  ${row(['ある変数から別の変数を予測する', '回帰分析', lk('5.1-regression','5.1')])}
  ${row(['時間にそった変化の傾向をつかむ', '時系列データの処理', lk('5.3-timeseries','5.3')])}
  ${row(['事前の情報を加えて確率を更新する', 'ベイズの定理', lk('2.2-bayes','2.2')])}
  </tbody>${wrapClose}

  <p style="margin-top:8px;font-size:0.85rem;color:#888">※ 早見表は典型的な対応を示すものです。前提条件（独立性・等分散・正規性・標本の大きさなど）の確認が必要な場合があります。詳細は各モジュールをご確認ください。</p>
  <p style="margin-top:16px"><a href="${base}/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`;
}
