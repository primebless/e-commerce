import eventBus, { emitAutomationEvent } from './eventBus.js';

const handlers = new Map();
const pending = [];

const state = {
  processing: false,
  enqueued: 0,
  completed: 0,
  failed: 0,
  lastRunAt: null,
  lastError: null,
};

const runNext = async () => {
  if (state.processing || pending.length === 0) return;

  state.processing = true;
  const job = pending.shift();

  try {
    const handler = handlers.get(job.name);
    if (!handler) throw new Error(`No handler registered for job: ${job.name}`);

    emitAutomationEvent('job.started', { id: job.id, name: job.name, payload: job.payload });
    await handler(job.payload || {});
    state.completed += 1;
    state.lastRunAt = new Date().toISOString();
    state.lastError = null;
    emitAutomationEvent('job.completed', { id: job.id, name: job.name });
  } catch (error) {
    state.failed += 1;
    state.lastError = error.message;
    emitAutomationEvent('job.failed', { id: job.id, name: job.name, error: error.message });
    console.error(`[AUTOMATION_JOB_FAILED] ${job.name}:`, error.message);
  } finally {
    state.processing = false;
    setImmediate(runNext);
  }
};

export const registerJobHandler = (name, handler) => {
  handlers.set(name, handler);
};

export const enqueueJob = (name, payload = {}) => {
  state.enqueued += 1;
  const job = {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    payload,
    enqueuedAt: new Date().toISOString(),
  };

  pending.push(job);
  emitAutomationEvent('job.enqueued', job);
  setImmediate(runNext);
  return job;
};

export const getQueueStats = () => ({
  ...state,
  pending: pending.length,
  registeredJobs: [...handlers.keys()],
});

export const onAutomationEvent = (eventName, handler) => {
  eventBus.on(eventName, handler);
};
