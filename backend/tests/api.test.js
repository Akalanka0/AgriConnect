import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../server.js';

test('API Root Route', async (t) => {
    await t.test('GET / should return successful response', async () => {
        const response = await request(app)
            .get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/);

        assert.ok(response.text.includes('AgriConnect API is running...'));
    });
});
