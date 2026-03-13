import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Must contain at least 1 number'),
});

export const createCircleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  careRecipient: z.string().min(1, 'Care recipient name is required').max(100),
  recipientDob: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurring: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  assignedToId: z.string().optional(),
});

export const createMedicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  instructions: z.string().optional(),
  prescriber: z.string().optional(),
  pharmacy: z.string().optional(),
  refillDate: z.string().optional(),
  schedules: z.array(z.object({ time: z.string(), label: z.string() })).min(1),
});

export const createJournalSchema = z.object({
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).optional(),
  energy: z.number().min(1).max(5).optional(),
  pain: z.number().min(0).max(10).optional(),
  sleep: z.string().optional(),
  appetite: z.string().optional(),
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
});

export const createAppointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  location: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().optional(),
  doctor: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  reminder: z.number().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type CreateCircleForm = z.infer<typeof createCircleSchema>;
export type CreateTaskForm = z.infer<typeof createTaskSchema>;
export type CreateMedicationForm = z.infer<typeof createMedicationSchema>;
export type CreateJournalForm = z.infer<typeof createJournalSchema>;
export type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;
