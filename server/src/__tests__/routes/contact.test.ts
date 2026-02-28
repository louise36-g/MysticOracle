/**
 * Contact Routes Tests
 * Tests for POST /submit - contact form submission
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock email service
vi.mock('../../services/email.js', () => ({
  sendContactFormEmail: vi.fn(),
}));

import contactRouter from '../../routes/contact.js';
import { sendContactFormEmail } from '../../services/email.js';

const mockSendContactFormEmail = sendContactFormEmail as Mock;

describe('Contact Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', contactRouter);
  });

  const validBody = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'This is a test message that is long enough.',
  };

  describe('POST /submit', () => {
    // --- Validation tests ---

    it('should return 400 when name is missing', async () => {
      const { name, ...body } = validBody;
      const res = await request(app).post('/submit').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/submit')
        .send({ ...validBody, email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('should return 400 when subject is missing', async () => {
      const { subject, ...body } = validBody;
      const res = await request(app).post('/submit').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when message is too short', async () => {
      const res = await request(app)
        .post('/submit')
        .send({ ...validBody, message: 'Short' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/10 characters/i);
    });

    it('should return 400 when message is too long', async () => {
      const res = await request(app)
        .post('/submit')
        .send({ ...validBody, message: 'x'.repeat(5001) });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    // --- Success tests ---

    it('should return success when valid data is provided', async () => {
      mockSendContactFormEmail.mockResolvedValue(true);

      const res = await request(app).post('/submit').send(validBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockSendContactFormEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Test Subject',
        'This is a test message that is long enough.',
        undefined,
        'en'
      );
    });

    it('should accept optional phone and language fields', async () => {
      mockSendContactFormEmail.mockResolvedValue(true);

      const res = await request(app)
        .post('/submit')
        .send({ ...validBody, phone: '+33612345678', language: 'fr' });

      expect(res.status).toBe(200);
      expect(mockSendContactFormEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Test Subject',
        'This is a test message that is long enough.',
        '+33612345678',
        'fr'
      );
    });

    it('should default language to "en" when not provided', async () => {
      mockSendContactFormEmail.mockResolvedValue(true);

      await request(app).post('/submit').send(validBody);

      expect(mockSendContactFormEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        undefined,
        'en'
      );
    });

    // --- Error tests ---

    it('should return 500 when email service returns false', async () => {
      mockSendContactFormEmail.mockResolvedValue(false);

      const res = await request(app).post('/submit').send(validBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to send/i);
    });
  });
});
