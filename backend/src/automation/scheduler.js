import { enqueueJob } from './jobQueue.js';

const timers = [];

const scheduleRecurring = (jobName, minutes) => {
  const ms = Math.max(1, minutes) * 60 * 1000;
  const timer = setInterval(() => {
    enqueueJob(jobName, { source: 'scheduler' });
  }, ms);

  timers.push(timer);
};

export const startAutomationScheduler = () => {
  if (String(process.env.AUTOMATION_ENABLED || 'true').toLowerCase() === 'false') {
    console.log('[AUTOMATION] disabled by AUTOMATION_ENABLED=false');
    return;
  }

  scheduleRecurring(
    'abandoned-cart-recovery',
    Number(process.env.AUTOMATION_ABANDONED_CART_EVERY_MIN || 60)
  );
  scheduleRecurring('low-stock-alerts', Number(process.env.AUTOMATION_LOW_STOCK_EVERY_MIN || 180));
  scheduleRecurring('weekly-kpi-digest', Number(process.env.AUTOMATION_KPI_EVERY_MIN || 10080));

  enqueueJob('abandoned-cart-recovery', { source: 'startup' });
  enqueueJob('low-stock-alerts', { source: 'startup' });

  console.log('[AUTOMATION] scheduler started');
};

export const stopAutomationScheduler = () => {
  while (timers.length) {
    clearInterval(timers.pop());
  }
};
