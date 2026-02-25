import { Router } from 'express';
import { z } from 'zod';
import { sendContactFormEmail } from '../services/email.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  phone: z.string().max(30).optional(),
  language: z.enum(['en', 'fr']).optional(),
});

router.post('/submit', async (req, res) => {
  try {
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
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Invalid input',
      });
    }
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
