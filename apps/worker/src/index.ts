const WORKER_NAME = "acra-analysis-worker";

console.log(`[${WORKER_NAME}] started successfully`);
console.log(`[${WORKER_NAME}] waiting for analysis jobs`);

function shutdown(signal: string): void {
  console.log(`[${WORKER_NAME}] received ${signal}`);
  console.log(`[${WORKER_NAME}] shutting down safely`);

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Keeps the worker alive until the queue consumer is added.
process.stdin.resume();