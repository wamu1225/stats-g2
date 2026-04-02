// src/data/modules.ts
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface KeyFormula {
  label: string;
  formula: string;
}

export interface Module {
  id: string;
  title: string;
  chapter: number;
  description: string;
  content: string;
  mathFormula?: string;
  interactiveType?: 'normal' | 't' | 'chi2' | 'f' | 'regression';
  keyFormulas?: KeyFormula[];
  quiz: QuizQuestion[];
}

const placeholder10 = (id: string): QuizQuestion[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: id + '-q' + (i + 1),
    question: '（準備中）問題 ' + (i + 1),
    options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
    correctAnswer: 0,
    explanation: '（準備中）',
  }));

export const modules: Module[] = [
  // ── Chapter 1: データの記述 ──────────────────────────────
  {
    id: '1.1-descriptive',
    title: 'データの整理と要約',
    chapter: 1,
    description: 'データを数値でとらえる基本手法を学びます。',
    content: `💡 **このモジュールで学ぶこと**

データ分析の第一歩は、手元にあるデータを「整理して要約する」ことです。平均・中央値・分散といった基本統計量の意味と計算方法を身につけましょう。

---

### 1. 平均・中央値・最頻値

データの「代表値」には主に3種類あります。

- **平均（mean）**: すべての値を足して個数で割る。外れ値に敏感。
- **中央値（median）**: 大小に並べたときの真ん中の値。外れ値に強い。
- **最頻値（mode）**: 最も多く現れる値。

n 個のデータ $x_1, x_2, \\ldots, x_n$ の平均は

$$\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i$$

---

### 2. 分散と標準偏差

データの「散らばり」を表す指標です。

$$s^2 = \\frac{1}{n} \\sum_{i=1}^{n} (x_i - \\bar{x})^2$$

標準偏差は $s = \\sqrt{s^2}$ で、単位がもとのデータと同じになるため解釈しやすい。

---

### 3. 四分位数と箱ひげ図

データを小さい順に並べて4等分したときの区切り値を**四分位数**といいます。

- Q1（第1四分位数）：下位25%の境界
- Q2（第2四分位数）：中央値
- Q3（第3四分位数）：上位25%の境界

**四分位範囲（IQR）** = Q3 − Q1 は外れ値に頑健な散らばりの指標です。
`,
    keyFormulas: [
      { label: '標本平均', formula: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^n x_i' },
      { label: '標本分散', formula: 's^2 = \\frac{1}{n}\\sum_{i=1}^n (x_i-\\bar{x})^2' },
      { label: 'IQR', formula: '\\text{IQR} = Q_3 - Q_1' },
    ],
    quiz: placeholder10('1.1-descriptive'),
  },
  {
    id: '1.2-visualization',
    title: 'データの可視化',
    chapter: 1,
    description: 'グラフでデータの分布・関係を視覚的に把握します。',
    content: `💡 **このモジュールで学ぶこと**

数値だけでは見えにくいデータの形や関係を、グラフで可視化する方法を学びます。

---

### 1. ヒストグラム

データを等幅の**階級（ビン）**に分けて頻度を棒グラフで表します。分布の形状（左右対称・右裾重い・左裾重いなど）を一目で把握できます。

---

### 2. 散布図と相関

2変数の関係を点で描いた図が**散布図**です。右上がりなら正の相関、右下がりなら負の相関があります。

相関の強さを数値で表す**ピアソン相関係数**は

$$r = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum(x_i-\\bar{x})^2 \\sum(y_i-\\bar{y})^2}}$$

$-1 \\le r \\le 1$ の範囲をとり、$|r|$ が1に近いほど強い線形相関です。

---

### 3. 茎葉図・度数分布表

**茎葉図**は元データを残しながら分布を表示できます。**度数分布表**は各階級の頻度・相対度数・累積度数をまとめた表です。
`,
    keyFormulas: [
      { label: 'ピアソン相関係数', formula: 'r = \\frac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum(x_i-\\bar{x})^2\\sum(y_i-\\bar{y})^2}}' },
    ],
    quiz: placeholder10('1.2-visualization'),
  },

  // ── Chapter 2: 確率の基礎 ────────────────────────────────
  {
    id: '2.1-probability',
    title: '確率の基礎',
    chapter: 2,
    description: '確率の定義・加法定理・乗法定理を理解します。',
    content: `💡 **このモジュールで学ぶこと**

「サイコロを振って3以下が出る確率」のような日常的な問いから出発し、確率の厳密な定義と計算規則を学びます。

---

### 1. 確率の定義

標本空間 $\\Omega$ の各事象 A に対して、次を満たす数 $P(A)$ を確率といいます。

1. $0 \\le P(A) \\le 1$
2. $P(\\Omega) = 1$
3. 排反な事象 $A_1, A_2, \\ldots$ に対して $P(A_1 \\cup A_2 \\cup \\cdots) = P(A_1) + P(A_2) + \\cdots$

---

### 2. 加法定理・余事象

$$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$$

余事象 $A^c$ の確率は $P(A^c) = 1 - P(A)$ です。

---

### 3. 条件付き確率と独立

事象 B が起こったという条件のもとで A が起こる確率：

$$P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}$$

$P(A \\mid B) = P(A)$ が成り立つとき、A と B は**独立**といいます。
`,
    keyFormulas: [
      { label: '加法定理', formula: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)' },
      { label: '条件付き確率', formula: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}' },
    ],
    quiz: placeholder10('2.1-probability'),
  },
  {
    id: '2.2-bayes',
    title: 'ベイズの定理',
    chapter: 2,
    description: '条件付き確率とベイズの定理の仕組みを理解します。',
    content: `💡 **このモジュールで学ぶこと**

「検査で陽性だったとき、本当に病気である確率は？」——これはベイズの定理を使って解く典型問題です。

---

### 1. 全確率の公式

互いに排反な原因 $B_1, B_2, \\ldots, B_k$ が $\\Omega$ を分割するとき：

$$P(A) = \\sum_{i=1}^{k} P(A \\mid B_i)\\,P(B_i)$$

---

### 2. ベイズの定理

$$P(B_j \\mid A) = \\frac{P(A \\mid B_j)\\,P(B_j)}{\\sum_{i=1}^{k} P(A \\mid B_i)\\,P(B_i)}$$

- $P(B_j)$：**事前確率**（データを見る前の信念）
- $P(B_j \\mid A)$：**事後確率**（データ A を観測した後の信念）

---

### 3. 具体例：感度・特異度・陽性適中率

感度（真陽性率）を $P(+ \\mid D)$、特異度（真陰性率）を $P(- \\mid D^c)$、有病率を $P(D)$ とすると、陽性適中率 PPV は

$$\\text{PPV} = \\frac{P(+\\mid D)\\,P(D)}{P(+\\mid D)\\,P(D) + P(+\\mid D^c)\\,(1-P(D))}$$
`,
    keyFormulas: [
      { label: 'ベイズの定理', formula: 'P(B_j\\mid A)=\\frac{P(A\\mid B_j)P(B_j)}{\\sum_i P(A\\mid B_i)P(B_i)}' },
    ],
    quiz: placeholder10('2.2-bayes'),
  },

  // ── Chapter 3: 確率分布 ──────────────────────────────────
  {
    id: '3.1-discrete',
    title: '離散型確率分布',
    chapter: 3,
    description: '二項分布・ポアソン分布など離散分布の特徴を学びます。',
    content: `💡 **このモジュールで学ぶこと**

「コインを10回投げて表が3回以下の確率」——このような整数値をとる確率変数を扱う離散型確率分布を学びます。

---

### 1. 確率質量関数と期待値

離散型確率変数 X の**確率質量関数（PMF）** $P(X = k)$ に対して

$$E[X] = \\sum_k k\\,P(X=k), \\quad V[X] = E[(X-E[X])^2]$$

---

### 2. 二項分布 $B(n, p)$

n 回の独立なベルヌーイ試行で成功が k 回起こる確率：

$$P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}$$

平均 $np$、分散 $np(1-p)$。

---

### 3. ポアソン分布 $\\text{Po}(\\lambda)$

単位時間あたり平均 $\\lambda$ 回起こるまれな事象の件数分布：

$$P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$$

平均 = 分散 = $\\lambda$。$n$ が大きく $p$ が小さい二項分布の近似として使われます。
`,
    keyFormulas: [
      { label: '二項分布PMF', formula: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}' },
      { label: 'ポアソン分布PMF', formula: 'P(X=k)=\\frac{\\lambda^k e^{-\\lambda}}{k!}' },
    ],
    quiz: placeholder10('3.1-discrete'),
  },
  {
    id: '3.2-continuous',
    title: '連続型確率分布',
    chapter: 3,
    description: '正規分布・指数分布など連続分布の性質を理解します。',
    interactiveType: 'normal',
    content: `💡 **このモジュールで学ぶこと**

連続型確率変数では「ちょうど x になる確率」は0です。確率密度関数（PDF）を積分することで区間の確率を求めます。

---

### 1. 確率密度関数（PDF）と CDF

$$P(a \\le X \\le b) = \\int_a^b f(x)\\,dx$$

累積分布関数（CDF）は $F(x) = P(X \\le x) = \\int_{-\\infty}^x f(t)\\,dt$。

---

### 2. 正規分布 $N(\\mu, \\sigma^2)$

$$f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} \\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)$$

標準化 $Z = (X - \\mu)/\\sigma$ で $N(0,1)$ に変換し、標準正規表を使います。

---

### 3. 指数分布 $\\text{Exp}(\\lambda)$

ポアソン過程で次のイベントまでの待ち時間の分布：

$$f(x) = \\lambda e^{-\\lambda x} \\quad (x \\ge 0)$$

平均 $1/\\lambda$、分散 $1/\\lambda^2$。**無記憶性**が重要な特徴です。
`,
    keyFormulas: [
      { label: '正規分布PDF', formula: 'f(x)=\\frac{1}{\\sqrt{2\\pi}\\sigma}\\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)' },
      { label: '指数分布PDF', formula: 'f(x)=\\lambda e^{-\\lambda x}\\;(x\\ge0)' },
    ],
    quiz: placeholder10('3.2-continuous'),
  },

  // ── Chapter 4: 統計的推測 ────────────────────────────────
  {
    id: '4.1-estimation',
    title: '推定',
    chapter: 4,
    description: '点推定・区間推定の考え方と信頼区間の構築を学びます。',
    interactiveType: 'normal',
    content: `💡 **このモジュールで学ぶこと**

「スプーン一杯の味見から鍋全体の味を推測する」——これが推定の本質です。標本から母集団のパラメータを推測する方法を学びます。

---

### 1. 点推定

母平均 $\\mu$ の推定量として**標本平均** $\\bar{X}$ が最もよく使われます。不偏分散

$$s^2 = \\frac{1}{n-1}\\sum_{i=1}^n (X_i - \\bar{X})^2$$

は $\\sigma^2$ の不偏推定量（$E[s^2] = \\sigma^2$）です。

---

### 2. 中心極限定理と標準誤差

標本サイズ n が十分大きければ

$$\\bar{X} \\sim N\\!\\left(\\mu,\\, \\frac{\\sigma^2}{n}\\right)$$

$\\sigma/\\sqrt{n}$ を**標準誤差（SE）**といい、推定の精度を表します。

---

### 3. 母平均の信頼区間

母分散既知のとき、母平均の $95\\%$ 信頼区間は

$$\\bar{X} \\pm 1.96\\,\\frac{\\sigma}{\\sqrt{n}}$$

母分散未知で n が小さいときは t 分布を使います。

$$\\bar{X} \\pm t_{n-1}(0.025)\\,\\frac{s}{\\sqrt{n}}$$
`,
    keyFormulas: [
      { label: '不偏分散', formula: 's^2=\\frac{1}{n-1}\\sum(X_i-\\bar{X})^2' },
      { label: '95%信頼区間（母分散既知）', formula: '\\bar{X}\\pm1.96\\,\\sigma/\\sqrt{n}' },
    ],
    quiz: placeholder10('4.1-estimation'),
  },
  {
    id: '4.2-testing',
    title: '仮説検定',
    chapter: 4,
    description: '帰無仮説・有意水準・p値・検定統計量の考え方を理解します。',
    interactiveType: 't',
    content: `💡 **このモジュールで学ぶこと**

「この薬は本当に効果があるか？」——このような問いに統計的な根拠を与えるのが**仮説検定**です。

---

### 1. 仮説検定の枠組み

1. **帰無仮説** $H_0$：「効果なし」など、棄却したい主張。
2. **対立仮説** $H_1$：証明したい主張。
3. **有意水準** $\\alpha$（通常5%）：第1種の誤りの確率の上限。
4. **検定統計量**を計算し、棄却域に入れば $H_0$ を棄却。

---

### 2. p値

p値は「帰無仮説が正しいとした場合に、今回と同等以上に極端なデータが得られる確率」です。

$$p\\text{-value} \\le \\alpha \\Rightarrow H_0 \\text{ を棄却}$$

---

### 3. 母平均の t 検定

母分散未知、標本 $n$ 個のとき：

$$t = \\frac{\\bar{X} - \\mu_0}{s/\\sqrt{n}} \\sim t_{n-1}$$

両側検定では $|t| > t_{n-1}(\\alpha/2)$ のとき棄却します。
`,
    keyFormulas: [
      { label: 't統計量', formula: 't=\\frac{\\bar{X}-\\mu_0}{s/\\sqrt{n}}' },
    ],
    quiz: placeholder10('4.2-testing'),
  },

  // ── Chapter 5: 応用手法 ──────────────────────────────────
  {
    id: '5.1-regression',
    title: '回帰分析',
    chapter: 5,
    description: '単回帰・最小二乗法・決定係数の基礎を学びます。',
    interactiveType: 'regression',
    content: `💡 **このモジュールで学ぶこと**

「身長から体重をどれくらい予測できるか」——回帰分析は変数間の線形関係を定式化し、予測に活用する手法です。

---

### 1. 単回帰モデル

$$Y_i = \\beta_0 + \\beta_1 X_i + \\varepsilon_i, \\quad \\varepsilon_i \\sim N(0, \\sigma^2)$$

$\\beta_0$：切片、$\\beta_1$：回帰係数（傾き）。

---

### 2. 最小二乗法（OLS）

残差二乗和 $\\sum (Y_i - \\hat{Y}_i)^2$ を最小化して係数を推定します。

$$\\hat{\\beta}_1 = \\frac{\\sum(X_i-\\bar{X})(Y_i-\\bar{Y})}{\\sum(X_i-\\bar{X})^2} = \\frac{S_{XY}}{S_{XX}}$$

$$\\hat{\\beta}_0 = \\bar{Y} - \\hat{\\beta}_1 \\bar{X}$$

---

### 3. 決定係数 $R^2$

モデルが Y の変動をどれだけ説明できるかを表す指標：

$$R^2 = 1 - \\frac{\\sum(Y_i - \\hat{Y}_i)^2}{\\sum(Y_i - \\bar{Y})^2}$$

$0 \\le R^2 \\le 1$、1に近いほど当てはまりが良い。
`,
    keyFormulas: [
      { label: '回帰係数', formula: '\\hat{\\beta}_1=S_{XY}/S_{XX}' },
      { label: '決定係数', formula: 'R^2=1-\\frac{SS_{\\text{res}}}{SS_{\\text{tot}}}' },
    ],
    quiz: placeholder10('5.1-regression'),
  },
  {
    id: '5.2-chi2-test',
    title: 'カイ二乗検定',
    chapter: 5,
    description: '適合度検定・独立性の検定の計算方法を習得します。',
    interactiveType: 'chi2',
    content: `💡 **このモジュールで学ぶこと**

「血液型と性格に関係はあるか？」——カテゴリカルデータの独立性を検定するのが**カイ二乗検定**です。

---

### 1. 適合度検定

観測度数 $O_i$ と期待度数 $E_i$ の乖離を測ります：

$$\\chi^2 = \\sum_{i=1}^k \\frac{(O_i - E_i)^2}{E_i}$$

帰無仮説「観測度数は期待度数に従う」のもとで $\\chi^2 \\sim \\chi^2_{k-1}$。

---

### 2. 独立性の検定（分割表）

$r \\times c$ 分割表で、行変数と列変数が独立かを検定します。

期待度数：$E_{ij} = \\frac{(\\text{行合計}_i)(\\text{列合計}_j)}{\\text{総計}}$

$$\\chi^2 = \\sum_i \\sum_j \\frac{(O_{ij} - E_{ij})^2}{E_{ij}} \\sim \\chi^2_{(r-1)(c-1)}$$

---

### 3. 注意点

- 各セルの期待度数が5以上であることが望ましい（期待度数が小さい場合はフィッシャーの正確検定を使う）。
- カイ二乗検定は関連の有無を検定するものであり、関連の強さや方向は別途検討が必要。
`,
    keyFormulas: [
      { label: 'カイ二乗統計量', formula: '\\chi^2=\\sum\\frac{(O_i-E_i)^2}{E_i}' },
      { label: '自由度（独立性検定）', formula: 'df=(r-1)(c-1)' },
    ],
    quiz: placeholder10('5.2-chi2-test'),
  },
];
