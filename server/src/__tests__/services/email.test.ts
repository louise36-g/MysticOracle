/**
 * Email Service Tests
 * Tests for transactional emails, template rendering, and contact management
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

// Set env before importing email module (it reads at import time)
process.env.BREVO_API_KEY = 'test-api-key';
process.env.FRONTEND_URL = 'https://test.celestiarcana.com';

// Use vi.hoisted so mock fns are available inside vi.mock factory (which is hoisted)
const { mockSendTransacEmail, mockCreateContact, mockUpdateContact } = vi.hoisted(() => ({
  mockSendTransacEmail: vi.fn().mockResolvedValue({}),
  mockCreateContact: vi.fn().mockResolvedValue({}),
  mockUpdateContact: vi.fn().mockResolvedValue({}),
}));

// Mock Brevo SDK using classes (required because the module uses `new`)
vi.mock('@getbrevo/brevo', () => {
  return {
    TransactionalEmailsApi: class {
      setApiKey = vi.fn();
      sendTransacEmail = mockSendTransacEmail;
    },
    TransactionalEmailsApiApiKeys: { apiKey: 0 },
    ContactsApi: class {
      setApiKey = vi.fn();
      createContact = mockCreateContact;
      updateContact = mockUpdateContact;
    },
    ContactsApiApiKeys: { apiKey: 0 },
    SendSmtpEmail: class {},
    CreateContact: class {},
    UpdateContact: class {},
  };
});

// Import after mocks and env setup
import {
  sendEmail,
  sendWelcomeEmail,
  sendPurchaseConfirmation,
  sendReferralInviteEmail,
  sendReferralRedeemedEmail,
  sendContactFormEmail,
  upsertContact,
  subscribeToNewsletter,
  unsubscribeContact,
} from '../../services/email.js';

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully and return true', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Hello</p>',
      });

      expect(result).toBe(true);
      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
    });

    it('should return false when API throws', async () => {
      mockSendTransacEmail.mockRejectedValue(new Error('API error'));

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        htmlContent: '<p>Hello</p>',
      });

      expect(result).toBe(false);
    });

    it('should set correct sender and recipient', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      await sendEmail({
        to: 'user@example.com',
        toName: 'Test User',
        subject: 'Test Subject',
        htmlContent: '<p>Content</p>',
        params: { key: 'value' },
        replyTo: { email: 'reply@example.com', name: 'Reply' },
      });

      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
      // The SendSmtpEmail object is passed to sendTransacEmail
      const sentEmailObj = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmailObj.to).toEqual([{ email: 'user@example.com', name: 'Test User' }]);
      expect(sentEmailObj.subject).toBe('Test Subject');
      expect(sentEmailObj.htmlContent).toBe('<p>Content</p>');
      expect(sentEmailObj.params).toEqual({ key: 'value' });
      expect(sentEmailObj.replyTo).toEqual({ email: 'reply@example.com', name: 'Reply' });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send EN welcome email with correct params', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendWelcomeEmail('user@example.com', 'Alice');

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Welcome to CelestiArcana');
      expect(sentEmail.params.username).toBe('Alice');
      expect(sentEmail.params.siteUrl).toBe('https://test.celestiarcana.com');
      expect(sentEmail.params.unsubscribeUrl).toBe('https://test.celestiarcana.com/unsubscribe');
    });

    it('should send FR welcome email when language is fr', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendWelcomeEmail('user@example.com', 'Alice', 'fr');

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Bienvenue sur CelestiArcana');
    });
  });

  describe('sendPurchaseConfirmation', () => {
    it('should send with correct credit/amount/balance params', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendPurchaseConfirmation('user@example.com', 'Alice', 50, 9.99, 75);

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.params.credits).toBe('50');
      expect(sentEmail.params.amount).toBe('€9.99');
      expect(sentEmail.params.newBalance).toBe('75');
    });

    it('should replace credits in subject line', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      await sendPurchaseConfirmation('user@example.com', 'Alice', 50, 9.99, 75);

      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('50 Credits Added');
      expect(sentEmail.subject).not.toContain('{{params.credits}}');
    });
  });

  describe('sendReferralInviteEmail', () => {
    it('should send with correct referralCode and signupUrl', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendReferralInviteEmail('friend@example.com', 'Bob', 'Alice', 'REF123');

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.params.referralCode).toBe('REF123');
      expect(sentEmail.params.signupUrl).toBe('https://test.celestiarcana.com/sign-up?ref=REF123');
      expect(sentEmail.params.senderName).toBe('Alice');
    });

    it('should replace senderName in subject', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      await sendReferralInviteEmail('friend@example.com', 'Bob', 'Alice', 'REF123');

      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Alice');
      expect(sentEmail.subject).not.toContain('{{params.senderName}}');
    });
  });

  describe('sendReferralRedeemedEmail', () => {
    it('should send with correct referrer/redeemer/credits params', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendReferralRedeemedEmail('referrer@example.com', 'Alice', 'Bob', 5);

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.params.referrerName).toBe('Alice');
      expect(sentEmail.params.redeemerName).toBe('Bob');
      expect(sentEmail.params.credits).toBe('5');
    });
  });

  describe('sendContactFormEmail', () => {
    it('should send to contact@ with replyTo set to sender', async () => {
      mockSendTransacEmail.mockResolvedValue({});

      const result = await sendContactFormEmail(
        'sender@example.com',
        'Sender Name',
        'Question about readings',
        'I have a question...'
      );

      expect(result).toBe(true);
      const sentEmail = mockSendTransacEmail.mock.calls[0][0];
      expect(sentEmail.to).toEqual([{ email: 'contact@celestiarcana.com', name: 'CelestiArcana' }]);
      expect(sentEmail.replyTo).toEqual({
        email: 'sender@example.com',
        name: 'Sender Name',
      });
      expect(sentEmail.subject).toContain('Sender Name');
    });
  });

  describe('upsertContact', () => {
    it('should create contact with attributes and listIds', async () => {
      mockCreateContact.mockResolvedValue({});

      const result = await upsertContact(
        'user@example.com',
        { USERNAME: 'Alice', LANGUAGE: 'en' },
        [1, 2]
      );

      expect(result).toBe(true);
      expect(mockCreateContact).toHaveBeenCalledTimes(1);
      const contact = mockCreateContact.mock.calls[0][0];
      expect(contact.email).toBe('user@example.com');
      expect(contact.attributes).toEqual({ USERNAME: 'Alice', LANGUAGE: 'en' });
      expect(contact.listIds).toEqual([1, 2]);
      expect(contact.updateEnabled).toBe(true);
    });

    it('should return false on API error', async () => {
      mockCreateContact.mockRejectedValue(new Error('API error'));

      const result = await upsertContact('user@example.com');

      expect(result).toBe(false);
    });
  });

  describe('subscribeToNewsletter', () => {
    it('should call upsertContact with newsletter list ID', async () => {
      mockCreateContact.mockResolvedValue({});

      const result = await subscribeToNewsletter('user@example.com', 'fr');

      expect(result).toBe(true);
      const contact = mockCreateContact.mock.calls[0][0];
      expect(contact.email).toBe('user@example.com');
      expect(contact.attributes).toEqual({ LANGUAGE: 'fr' });
      expect(contact.listIds).toEqual([1]); // NEWSLETTER_LIST_ID = 1
    });
  });

  describe('unsubscribeContact', () => {
    it('should blacklist email in Brevo', async () => {
      mockUpdateContact.mockResolvedValue({});

      const result = await unsubscribeContact('user@example.com');

      expect(result).toBe(true);
      expect(mockUpdateContact).toHaveBeenCalledTimes(1);
      // First arg is email, second is UpdateContact object
      expect(mockUpdateContact.mock.calls[0][0]).toBe('user@example.com');
      const updateObj = mockUpdateContact.mock.calls[0][1];
      expect(updateObj.emailBlacklisted).toBe(true);
    });
  });
});
