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
      id: z.string().uuid({ message: 'Invalid product ID' }),
      quantity: z.number().int().positive({ message: 'Quantity must be greater than zero' }),
    })
  ).min(1, { message: 'Cart must contain at least one item' }),
});

export const TippingSchema = z.object({
  eventId: z.string().uuid({ message: 'Invalid event ID' }),
  email: z.string().email({ message: 'Invalid email address' }).min(3),
  phone: z.string().min(6).max(20).optional().nullable().or(z.literal('')),
  comment: z.string().max(500, { message: 'Comment cannot exceed 500 characters' }).optional().nullable(),
  amountCents: z.number().int().positive({ message: 'Amount must be greater than zero' }),
});

export const TicketVerifySchema = z.object({
  qrCodeHash: z.string().length(64, { message: 'QR Code signature must be a 64-character hex string' }),
});
