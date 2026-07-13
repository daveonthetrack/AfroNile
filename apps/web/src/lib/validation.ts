import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).min(3),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).min(3),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const CheckoutCartSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1, { message: 'Invalid product ID' }),
      quantity: z.number().int().positive({ message: 'Quantity must be greater than zero' }),
    })
  ).min(1, { message: 'Cart must contain at least one item' }),
});

export const TippingSchema = z.object({
  eventId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().uuid({ message: 'Invalid event ID' }).optional()
  ),
  email: z.string().email({ message: 'Invalid email address' }).min(3),
  phone: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().max(20, { message: 'Phone number is too long' }).nullable().optional()
  ),
  comment: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().max(500, { message: 'Comment cannot exceed 500 characters' }).nullable().optional()
  ),
  amountCents: z.number().int().positive({ message: 'Amount must be greater than zero' }),
});

export const TicketVerifySchema = z.object({
  qrCodeHash: z.string().length(64, { message: 'QR Code signature must be a 64-character hex string' }),
});
