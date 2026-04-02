// stats-app/src/utils/math.ts

/**
 * Normal Distribution PDF
 */
export function normalPDF(x: number, mean: number, std: number): number {
  const p = 1 / (std * Math.sqrt(2 * Math.PI));
  const e = Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
  return p * e;
}

/**
 * t-Distribution PDF (Approximation)
 */
export function tPDF(x: number, df: number): number {
  const coeff = gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * gamma(df / 2));
  return coeff * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
}

/**
 * Chi-Square PDF
 */
export function chi2PDF(x: number, df: number): number {
  if (x <= 0) return 0;
  return (Math.pow(x, df / 2 - 1) * Math.exp(-x / 2)) / (Math.pow(2, df / 2) * gamma(df / 2));
}

/**
 * F-Distribution PDF
 */
export function fPDF(x: number, df1: number, df2: number): number {
  if (x <= 0) return 0;
  const num = Math.pow(df1 * x, df1) * Math.pow(df2, df2);
  const den = Math.pow(df1 * x + df2, df1 + df2);
  const coeff = gamma((df1 + df2) / 2) / (gamma(df1 / 2) * gamma(df2 / 2));
  return coeff * Math.sqrt(num / den) / x;
}

/**
 * Gamma function approximation using Lanczos method
 */
export function gamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Calculate the angle of the first principal component and its contribution ratio
 */
export function calculatePCA(points: { x: number; y: number }[]) {
  if (points.length < 2) return { angle: 0, ratio: 0 };

  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  let sxx = 0, sxy = 0, syy = 0;
  points.forEach(p => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  });
  
  // Angle of the first eigenvector
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);

  // Eigenvalues of covariance matrix
  // Matrix is [[sxx, sxy], [sxy, syy]] / (n-1)
  const trace = (sxx + syy);
  const det = sxx * syy - sxy * sxy;
  
  // Solve: L^2 - trace*L + det = 0
  const discriminant = Math.sqrt(trace * trace - 4 * det);
  const L1 = (trace + discriminant) / 2;
  const L2 = (trace - discriminant) / 2;

  const ratio = L1 / (L1 + L2 || 1);

  return { angle, ratio };
}
