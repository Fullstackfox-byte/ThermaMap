/**
 * Statistical ML service (pure JavaScript, no external ML library).
 *
 * Model: Ridge-regularised multivariate linear regression
 *        LST ~ NDVI + built-up ratio + albedo
 * Validation: Leave-One-Out Cross-Validation (LOOCV) - the only honest option for tiny datasets.
 * Every metric returned here is COMPUTED from the data passed in. Nothing is hard-coded.
 */

const FEATURES = [
  { key: 'ndvi', label: 'NDVI (vegetation)' },
  { key: 'builtUpRatio', label: 'Built-up ratio (%)' },
  { key: 'albedo', label: 'Surface albedo' }
];
const TARGET = 'surfaceTemp';
const MIN_RELIABLE_SAMPLES = 30;

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr, m = mean(arr)) {
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v) || 1;
}

// Gaussian elimination with partial pivoting. Solves A x = b.
function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) throw new Error('Singular matrix');
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

function fit(rows, lambda = 0.5) {
  const p = FEATURES.length;
  const xs = rows.map((r) => FEATURES.map((f) => Number(r[f.key])));
  const ys = rows.map((r) => Number(r[TARGET]));

  const means = FEATURES.map((_, j) => mean(xs.map((x) => x[j])));
  const stds = FEATURES.map((_, j) => std(xs.map((x) => x[j]), means[j]));
  const yMean = mean(ys);

  const Z = xs.map((x) => x.map((v, j) => (v - means[j]) / stds[j]));
  const yc = ys.map((y) => y - yMean);

  // (Z'Z + lambda*I) w = Z'y
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < Z.length; i++) {
    for (let j = 0; j < p; j++) {
      b[j] += Z[i][j] * yc[i];
      for (let k = 0; k < p; k++) A[j][k] += Z[i][j] * Z[i][k];
    }
  }
  for (let j = 0; j < p; j++) A[j][j] += lambda;

  const w = solveLinearSystem(A, b);
  return { w, means, stds, yMean, lambda };
}

function predictRaw(model, featureObj) {
  let out = model.yMean;
  FEATURES.forEach((f, j) => {
    out += model.w[j] * ((Number(featureObj[f.key]) - model.means[j]) / model.stds[j]);
  });
  return out;
}

function r2(actual, predicted) {
  const m = mean(actual);
  const ssTot = actual.reduce((a, y) => a + (y - m) ** 2, 0);
  const ssRes = actual.reduce((a, y, i) => a + (y - predicted[i]) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

function rmse(actual, predicted) {
  return Math.sqrt(actual.reduce((a, y, i) => a + (y - predicted[i]) ** 2, 0) / actual.length);
}

function mae(actual, predicted) {
  return actual.reduce((a, y, i) => a + Math.abs(y - predicted[i]), 0) / actual.length;
}

function trainAndValidate(zones) {
  const rows = zones.filter((z) => FEATURES.every((f) => Number.isFinite(Number(z[f.key]))) && Number.isFinite(Number(z[TARGET])));
  const n = rows.length;
  if (n < 4) {
    return { trained: false, n, reason: 'Need at least 4 samples to train and cross-validate.' };
  }

  const model = fit(rows);
  const actual = rows.map((r) => Number(r[TARGET]));
  const fitted = rows.map((r) => predictRaw(model, r));

  // Leave-one-out cross-validation
  const loo = rows.map((_, i) => {
    const train = rows.filter((__, j) => j !== i);
    return predictRaw(fit(train), rows[i]);
  });

  const importance = FEATURES.map((f, j) => ({
    feature: f.key,
    label: f.label,
    standardizedCoefficient: Number(model.w[j].toFixed(4)),
    // °C change in LST for +1 raw unit of the feature, others held constant
    coefficientPerUnit: Number((model.w[j] / model.stds[j]).toFixed(4))
  }));

  return {
    trained: true,
    modelType: 'Ridge linear regression (lambda=' + model.lambda + ')',
    target: 'Land Surface Temperature (°C)',
    n,
    metrics: {
      trainR2: Number(r2(actual, fitted).toFixed(3)),
      trainRMSE: Number(rmse(actual, fitted).toFixed(3)),
      loocvR2: Number(r2(actual, loo).toFixed(3)),
      loocvRMSE: Number(rmse(actual, loo).toFixed(3)),
      loocvMAE: Number(mae(actual, loo).toFixed(3))
    },
    importance,
    reliability: n >= MIN_RELIABLE_SAMPLES ? 'ACCEPTABLE_SAMPLE_SIZE' : 'INSUFFICIENT_SAMPLE_SIZE',
    warnings: n >= MIN_RELIABLE_SAMPLES ? [] : [
      `Only ${n} samples used (recommended >= ${MIN_RELIABLE_SAMPLES}). Metrics are indicative only.`,
      'Trained on demo/seed zone attributes, not on real Landsat/Sentinel pixels. Replace with GEE-sampled data before claiming accuracy.'
    ],
    _model: model,
    _rows: rows
  };
}

function predictLST(trained, featureObj) {
  if (!trained.trained) throw new Error('Model not trained');
  return Number(predictRaw(trained._model, featureObj).toFixed(2));
}

// Statistical hotspot detection (z-score of LST against the study-area distribution)
function detectHotspots(zones) {
  const temps = zones.map((z) => z.surfaceTemp);
  const m = mean(temps);
  const s = std(temps, m);
  return zones
    .map((z) => {
      const zScore = (z.surfaceTemp - m) / s;
      let hotspotClass = 'Not a hotspot';
      if (zScore >= 1.0) hotspotClass = 'Statistical hotspot (z >= 1.0)';
      else if (zScore >= 0.5) hotspotClass = 'Elevated (0.5 <= z < 1.0)';
      else if (zScore <= -1.0) hotspotClass = 'Cool spot (z <= -1.0)';
      return {
        code: z.code,
        name: z.name,
        surfaceTemp: z.surfaceTemp,
        zScore: Number(zScore.toFixed(2)),
        hotspotClass
      };
    })
    .sort((a, b) => b.zScore - a.zScore);
}

// Pearson correlation between each feature and LST
function correlations(zones) {
  const ys = zones.map((z) => z[TARGET]);
  return FEATURES.map((f) => {
    const xs = zones.map((z) => z[f.key]);
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    xs.forEach((x, i) => {
      num += (x - mx) * (ys[i] - my);
      dx += (x - mx) ** 2;
      dy += (ys[i] - my) ** 2;
    });
    const r = dx && dy ? num / Math.sqrt(dx * dy) : 0;
    return { feature: f.key, label: f.label, pearsonR: Number(r.toFixed(3)) };
  });
}

module.exports = { trainAndValidate, predictLST, detectHotspots, correlations, FEATURES };