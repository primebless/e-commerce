import { EventEmitter } from 'node:events';

const eventBus = new EventEmitter();

export const emitAutomationEvent = (eventName, payload = {}) => {
  eventBus.emit(eventName, {
    eventName,
    payload,
    at: new Date().toISOString(),
  });
};

export default eventBus;
