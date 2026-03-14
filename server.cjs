/**
 * CommonJS wrapper for Hostinger / lsnode.
 * They use require(); our app is ESM. This file is loaded by require(), then dynamically imports server.js.
 */
import('./server.js').catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
