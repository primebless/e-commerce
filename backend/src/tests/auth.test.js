import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';

describe('Auth and Protected Routes', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.ok).to.equal(true);
  });

  it('blocks unauthenticated profile access', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).to.equal(401);
  });

  it('blocks unauthenticated protected order route', async () => {
    const res = await request(app).get('/api/orders/mine');
    expect(res.status).to.equal(401);
  });
});
