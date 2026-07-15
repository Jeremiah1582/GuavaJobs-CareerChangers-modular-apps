/**
 * Coolify/Hetzner runs the API and BullMQ processors together in one always-on
 * container by default. Set RUN_BULLMQ_WORKERS=false only if processors are split
 * into a dedicated worker deployment (e.g. a second Coolify app/resource).
 */
export function shouldRunBullmqWorkers(): boolean {
  const flag = process.env.RUN_BULLMQ_WORKERS;
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return true;
}
