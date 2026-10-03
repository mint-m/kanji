// 헬스체크만 검증하므로 컨트롤러(axios ESM 등)를 끌어오는 API 라우터는 빈 라우터로 대체
jest.mock('../routes', () => ({ __esModule: true, default: jest.requireActual('express').Router() }));

import http from 'http';
import { AddressInfo } from 'net';
import mongoose from 'mongoose';
import app from '../app';

let server: http.Server;
let baseUrl: string;

beforeAll((done) => {
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

// readyState는 spyOn이 불가(non-configurable)해 mongoose 자체 setter로 바꾸고 되돌린다
afterEach(() => {
  mongoose.connection.readyState = mongoose.ConnectionStates.disconnected;
});

const get = (path: string) =>
  new Promise<{ status: number; body: any }>((resolve, reject) => {
    http
      .get(`${baseUrl}${path}`, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) }));
      })
      .on('error', reject);
  });

describe('GET /health', () => {
  it('DB 연결 시 200', async () => {
    mongoose.connection.readyState = mongoose.ConnectionStates.connected;
    const { status, body } = await get('/health');
    expect(status).toBe(200);
    expect(body).toEqual({ success: true, data: { db: 'up' } });
  });

  it('DB 끊김 시 503', async () => {
    mongoose.connection.readyState = mongoose.ConnectionStates.disconnected;
    const { status, body } = await get('/health');
    expect(status).toBe(503);
    expect(body).toEqual({ success: false, data: { db: 'down' } });
  });
});
