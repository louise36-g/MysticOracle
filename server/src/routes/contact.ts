import { Router } from 'express';
import { z } from 'zod';
import { sendContactFormEmail } from '../services/email.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApplicationError } from '../shared/errors/ApplicationError.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  phone: z.string().max(30).optional(),
  language: z.enum(['en', 'fr']).optional(),
});

router.post(
  '/submit',
  asyncHandler(async (req, res) => {
    const data = contactSchema.parse(req.body);

    const sent = await sendContactFormEmail(
      data.email,
      data.name,
      data.subject,
      data.message,
      data.phone,
      data.language || 'en'
    );

    if (!sent) {
      throw new ApplicationError(
        'Failed to send message. Please try again.',
        'EMAIL_SEND_FAILED',
        500
      );
    }

    res.json({ success: true });
  })
);

export default router;
