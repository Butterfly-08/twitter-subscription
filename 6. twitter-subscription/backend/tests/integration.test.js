const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const env = require('../config/env');
const User = require('../models/User');
const OtpRequest = require('../models/OtpRequest');

describe('Language Switch OTP Flow', () => {
  let token;
  let csrfToken;
  let cookies;

  beforeAll(async () => {
    // Connect to a test db
    const testDbUri = env.DB_URI + '_test';
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await OtpRequest.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('should mock login and return token', async () => {
    const res = await request(app).post('/api/auth/login').send();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    token = res.body.token;
  });

  it('should get CSRF token', async () => {
    const res = await request(app).get('/api/auth/csrf-token');
    expect(res.statusCode).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    csrfToken = res.body.csrfToken;
    cookies = res.headers['set-cookie'];
  });

  it('should request language change to French (Email OTP)', async () => {
    const res = await request(app)
      .post('/api/language/request-change')
      .set('Authorization', `Bearer ${token}`)
      .set('CSRF-Token', csrfToken)
      .set('Cookie', cookies)
      .send({ targetLanguage: 'fr' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.channel).toBe('email');
    expect(res.body.otpRequestId).toBeDefined();

    // Verify OTP Request exists in DB
    const otpReq = await OtpRequest.findById(res.body.otpRequestId);
    expect(otpReq).not.toBeNull();
    expect(otpReq.targetLanguage).toBe('fr');
  });

  it('should request language change to Spanish (SMS OTP)', async () => {
    const res = await request(app)
      .post('/api/language/request-change')
      .set('Authorization', `Bearer ${token}`)
      .set('CSRF-Token', csrfToken)
      .set('Cookie', cookies)
      .send({ targetLanguage: 'es' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.channel).toBe('sms');
  });

  it('guest should set language directly', async () => {
    const res = await request(app)
      .post('/api/language/guest-set')
      .set('CSRF-Token', csrfToken)
      .set('Cookie', cookies)
      .send({ language: 'pt' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.language).toBe('pt');
    
    // verify cookie is set
    const setCookie = res.headers['set-cookie'][0];
    expect(setCookie).toMatch(/guestLanguage=pt/);
  });
});
