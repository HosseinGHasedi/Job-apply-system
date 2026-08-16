#!/usr/bin/env node
/**
 * Specialization self-test: load default config and print status.
 * Does not score jobs or read candidate PII.
 */

import { health } from './index.mjs';

const result = health();
if (!result.ok) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
