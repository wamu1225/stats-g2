// stats-app/src/data/glossary.ts

export interface Term {
  id: string;
  term: string;
  explanation: string;
  formula?: string;
  level: '基礎' | '中級' | '上級';
  relatedTerms?: string[];
}

export const glossary: Record<string, Term> = {
  'population': {
    id: 'population',
    term: '母集団 (Population)',
    explanation: 'あなたが「本当に知りたい」対象の全容。例えば、スープの味見における「鍋全体のスープ」にあたります。全数調査が困難なため、一部（標本）からその性質（母数）を推測します。',
    level: '基礎',
    relatedTerms: ['sample', 'mle']
  },
  'sample': {
    id: 'sample',
    term: '標本 (Sample)',
    explanation: '母集団から取り出された「手元にあるデータ」。スープの味見における「スプーン一杯」のこと。標本の平均などは、偶然の偏り（サンプリング誤差）を含むため、慎重に扱う必要があります。',
    level: '基礎',
    relatedTerms: ['population', 'central-limit']
  },
  'mle': {
    id: 'mle',
    term: '最尤推定法 (MLE)',
    explanation: '「今のデータが観察されたのは、どんな真実（母数）があったからだと考えるのが一番納得がいくか？」を探る手法。「最も（最）尤もらしい」値を答えとして採用します。',
    formula: 'L(\\theta) = \\prod_{i=1}^n f(x_i | \\theta)',
    level: '上級',
    relatedTerms: ['likelihood', 'aic', 'fisher-info']
  },
  'fisher-info': {
    id: 'fisher-info',
    term: 'フィッシャー情報量',
    explanation: 'データが母数 $\\theta$ に関してどれだけ「鋭い情報」を持っているかの指標。情報量が多いほど、推定のブレ（分散）を小さくできることが数理的に保証されます。',
    formula: 'I(\\theta) = E \\left[ \\left( \\frac{\\partial}{\\partial \\theta} \\log f(X|\\theta) \\right)^2 \\right]',
    level: '上級',
    relatedTerms: ['mle']
  },
  'pvalue': {
    id: 'pvalue',
    term: 'P値 (P-value)',
    explanation: '「差がない」という仮定の下で、今のデータ（またはそれ以上の差）が観測される確率。これが極めて小さい（通常 5% 未満）とき、「たまたまとは考えにくい＝意味のある差だ」と判断します。',
    level: '中級',
    relatedTerms: ['alpha', 'power']
  },
  'alpha': {
    id: 'alpha',
    term: '有意水準 / 第1種の過誤 ($\\alpha$)',
    explanation: '「本当は差がないのに、誤って差があると言ってしまう」間違いの許容ライン。裁判で例えると「無実の人を有罪にしてしまう」冤罪のリスク設定です。',
    level: '中級',
    relatedTerms: ['pvalue', 'beta']
  },
  'beta': {
    id: 'beta',
    term: '第2種の過誤 ($\\beta$)',
    explanation: '「本当は差があるのに、それを見逃してしまう」間違い。病気を見逃すリスクに相当します。これを小さく抑えることが、分析の「見逃し防止能力」を高めます。',
    level: '中級',
    relatedTerms: ['alpha', 'power']
  },
  'power': {
    id: 'power',
    term: '検出力 (Statistical Power)',
    explanation: '「実際に差があるときに、正しく差があると言える能力（$1-\\beta$）」。この数値が高いほど、意味のある変化を鋭敏に捉えられる優れた調査と言えます。',
    level: '中級',
    relatedTerms: ['beta']
  },

  'central-limit': {
    id: 'central-limit',
    term: '中心極限定理 (CLT)',
    explanation: '「どんな分布でも、$n$ が十分大きければ、平均値の分布は正規分布に**近づく**」という最強の定理。これがあるおかげで、元のデータがどんなに歪んでいても、標本平均については正規分布の公式で分析が可能になります。',
    level: '中級',
    relatedTerms: ['sample', 'population']
  },
  'aic': {
    id: 'aic',
    term: '赤池情報量規準 (AIC)',
    explanation: '「予測の正確さ」と「モデルのシンプルさ」のバランスを測る指標。低ければ低いほど「実用的な良いモデル」と判断され、AIのモデル選びなどで広く使われます。',
    formula: '\\text{AIC} = -2\\log L + 2k',
    level: '上級',
    relatedTerms: ['mle', 'overfitting']
  },
  'overfitting': {
    id: 'overfitting',
    term: '過学習 (Overfitting)',
    explanation: '手元のデータの「ノイズ」まで完璧に学習してしまい、新しいデータに対して予測が全く当たらなくなる現象。「過去問の答えを丸暗記して、本番の試験で応用が効かない生徒」のような状態です。',
    level: '中級',
    relatedTerms: ['aic', 'regularization']
  },
  'logistic': {
    id: 'logistic',
    term: 'ロジスティック回帰',
    explanation: '「合格・不合格」「クリックする・しない」といった、2択の確率を予測する手法。出力が必ず 0 から 1 の間に収まる数理的な工夫（シグモイド関数）が施されています。',
    formula: 'P(y=1|\\mathbf{x}) = \\frac{1}{1 + \\exp(-(\\beta_0 + \\mathbf{\\beta}^T\\mathbf{x}))}',
    level: '上級',
    relatedTerms: ['odds']
  },
  'odds': {
    id: 'odds',
    term: 'オッズ比 (Odds Ratio)',
    explanation: '「ある事象が起こる確率」と「起こらない確率」の比。ギャンブルの配当設定の考え方に近く、ある要因がリスクを何倍高めるかを示す際によく用いられます。',
    level: '中級',
    relatedTerms: ['logistic']
  },
  'likelihood': {
    id: 'likelihood',
    term: '尤度 (Likelihood)',
    explanation: '「ある仮説（母数 $\\theta$）の下で、今あるデータが観察される確率（連続分布の場合は確率密度）」。これを最大にする仮説を選ぶのが最尤推定法です。',
    level: '中級',
    relatedTerms: ['mle', 'aic']
  },
  'interaction': {
    id: 'interaction',
    term: '交互作用 (Interaction)',
    explanation: '「薬 A の効果が、薬 B を同時に飲むかどうかで変わる」といった、**一方の因子の効果が他方の因子の水準に依存する**現象。効果が増幅される場合も減衰される場合もある。',
    level: '中級',
    relatedTerms: ['anova']
  },
  'mahalanobis': {
    id: 'mahalanobis',
    term: 'マハラノビス距離',
    explanation: '「データのばらつき」を考慮した距離。単なる距離ではなく、集団の形状（楕円形など）に合わせて測るため、不自然なデータ（外れ値）を正確に見つけられます。',
    formula: 'D^2 = (\\mathbf{x}-\\mu)^T \\Sigma^{-1} (\\mathbf{x}-\\mu)',
    level: '上級',
    relatedTerms: ['eigen']
  },
  'multico': {
    id: 'multico',
    term: '多重共線性 (Multicollinearity)',
    explanation: '説明変数の中に「ほとんど同じ意味の変数」が混ざっている状態。計算が不安定になり、分析結果が壊れる原因となるため、不必要な変数を削る必要があります。',
    level: '中級',
    relatedTerms: ['regularization']
  },
  'cross-validation': {
    id: 'cross-validation',
    term: '交差妥当化 (Cross-Validation)',
    explanation: 'データを「学習用」と「テスト用」に小分けにして入れ替えながら、何度もテストを繰り返す手法。モデルの「本番（未知のデータ）への強さ」を客観的に評価できます。',
    level: '中級',
    relatedTerms: ['bootstrap', 'overfitting']
  },
  'bootstrap': {
    id: 'bootstrap',
    term: 'ブートストラップ法',
    explanation: '「今あるデータから**復元抽出**（同じデータを何度でも選べる再抽出）を繰り返す」シミュレーション手法。高度な数学公式が使えない複雑な状況でも、数値的に信頼区間などを求められます。',
    level: '上級'
  },
  'jacobian': {
    id: 'jacobian',
    term: 'ヤコビアン (Jacobian)',
    explanation: 'グラフを変形したときに「面積や体積がどれくらい伸び縮みしたか」を示す拡大率。複雑な変数変換を行う際、確率密度のつじつまを合わせるために必要です。',
    level: '上級'
  },
  'stationary': {
    id: 'stationary',
    term: '定常性 (Stationarity)',
    explanation: '時間の経過によらず、データの「性質（平均やばらつき）」が変わらないこと。時系列予測を行うための「安定した土台」のような前提条件です。',
    level: '上級',
    relatedTerms: ['arima']
  },
  'arima': {
    id: 'arima',
    term: 'ARIMAモデル',
    explanation: '「過去の自分」と「最新のトレンド（誤差）」から未来を予測する時系列モデルの王道。株価や気温など、刻々と変化するデータの予測に使われます。',
    level: '上級',
    relatedTerms: ['stationary']
  },
  'censoring': {
    id: 'censoring',
    term: '打ち切り (Censoring)',
    explanation: '寿命調査などで、「まだ生きていて、いつ終わるかわからない」という不完全なデータ。この「終わっていない」という情報自体も捨てずに分析に活かします。',
    level: '中級'
  },
  'eigen': {
    id: 'eigen',
    term: '固有値・固有ベクトル',
    explanation: 'データ行列の「背骨（最もばらついている方向）」とその「強度」を抽出するもの。主成分分析においては、これを使って情報の要約を行います。',
    level: '上級',
    relatedTerms: ['pca']
  },
  'regularization': {
    id: 'regularization',
    term: '正則化 (Regularization)',
    explanation: 'モデルが複雑になりすぎないよう、「お仕置き（ペナルティ）」を与える手法。いらない変数を切り捨てたり、係数が極端になるのを防ぎます。',
    level: '上級',
    relatedTerms: ['overfitting', 'multico']
  },
  'anova': {
    id: 'anova',
    term: '分散分析 (ANOVA)',
    explanation: '「3つ以上のグループ」の間で平均に差があるかを一気に判定する手法。「グループ内のばらつき」と「グループ間のばらつき」を戦わせて判定します。',
    level: '中級',
    relatedTerms: ['interaction']
  },
  'confounding': {
    id: 'confounding',
    term: '交絡 (Confounding)',
    explanation: '「コーヒーを飲む人はガンになりやすい？」という調査で、「コーヒー好きはタバコも吸う人が多い」という隠れた要因（タバコ）が結果を歪めてしまうような現象。',
    level: '中級'
  },
  'factor-analysis': {
    id: 'factor-analysis',
    term: '因子分析',
    explanation: '目に見えない「性格」や「価値観」などの共通因子を、アンケート回答などの目に見えるデータからあぶり出す手法。',
    level: '上級',
    relatedTerms: ['eigen']
  },
  'cluster-analysis': {
    id: 'cluster-analysis',
    term: 'クラスター分析',
    explanation: '異なる特徴を持つ集団を、似た者同士で「自動的にグループ分け」する手法。事前の正解がない「教師なし学習」の代表例です。',
    level: '中級'
  },
  'non-parametric': {
    id: 'non-parametric',
    term: 'ノンパラメトリック手法',
    explanation: 'データの「正確な値」ではなく「順位」を利用する手法。外れ値に非常に強く、データの分布が正規分布でなくても安心して使えます。',
    level: '中級'
  },
  'sufficiency': {
    id: 'sufficiency',
    term: '十分統計量',
    explanation: '母数に関する「すべての情報」をギュッと凝縮した統計量。例えば、正規分布の平均を推測する際、個々のデータ全部を覚えている必要はなく、その「合計値」だけ知っていれば十分だ、という考え方です。',
    level: '上級',
    relatedTerms: ['mle']
  }
};
