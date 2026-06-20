import process from 'node:process';

try {
  process.loadEnvFile('.dev.vars');
} catch {
  // No .dev.vars (e.g. CI) — rely on real env vars instead.
}
