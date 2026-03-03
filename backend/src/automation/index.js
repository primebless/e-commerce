import eventBus from './eventBus.js';
import { registerJobHandler } from './jobQueue.js';
import {
  runAbandonedCartRecoveryJob,
  runLowStockAlertsJob,
  runWeeklyKpiDigestJob,
} from './jobs.js';
import { startAutomationScheduler } from './scheduler.js';

let initialized = false;

export const initAutomation = () => {
  if (initialized) return;

  registerJobHandler('abandoned-cart-recovery', runAbandonedCartRecoveryJob);
  registerJobHandler('low-stock-alerts', runLowStockAlertsJob);
  registerJobHandler('weekly-kpi-digest', runWeeklyKpiDigestJob);

  eventBus.on('job.enqueued', ({ payload }) => {
    console.log(`[AUTOMATION] queued: ${payload.name}`);
  });

  eventBus.on('job.completed', ({ payload }) => {
    console.log(`[AUTOMATION] completed: ${payload.name}`);
  });

  eventBus.on('job.failed', ({ payload }) => {
    console.log(`[AUTOMATION] failed: ${payload.name} | ${payload.error}`);
  });

  startAutomationScheduler();
  initialized = true;
};

export { runAbandonedCartRecoveryJob, runLowStockAlertsJob, runWeeklyKpiDigestJob };
export { getQueueStats, enqueueJob } from './jobQueue.js';
export { getAutomationKpis } from './kpiService.js';
