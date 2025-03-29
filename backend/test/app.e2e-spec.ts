/* eslint-disable @typescript-eslint/no-unsafe-argument */
// Disabling strict typing for test files only, as per project standards

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Create a type-safe wrapper for supertest that works with NestJS HTTP server
 */
function createTestRequest(app: INestApplication) {
  return request(app.getHttpServer());
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // Using a type-safe wrapper function
    return createTestRequest(app).get('/').expect(200).expect('Hello World!');
  });
});
