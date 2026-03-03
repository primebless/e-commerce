import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('returns health status', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('blocks unauthenticated profile access', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('blocks unauthenticated protected order route', async () => {
  const res = await request(app).get('/api/orders/mine');
  assert.equal(res.status, 401);
});
