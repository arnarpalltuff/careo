import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { aiLimiter } from '../middleware/rateLimit';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../utils/prisma';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
  circleId: z.string().optional(),
});

const SYSTEM_PROMPT = `You are Careo's Care Assistant — a warm, knowledgeable AI helper for family caregivers.

Your role:
- Answer questions about caregiving, elder care, and health management
- Help interpret medication schedules and side effects (always recommend consulting a doctor)
- Offer practical tips for daily caregiving routines
- Provide emotional support and stress management advice for caregivers
- Help with care coordination and communication tips
- Navigate Medicare, Medicaid, VA benefits, FMLA, and long-term care insurance questions
- Help plan care transitions (hospital to home, home to facility)
- Assist with legal questions (power of attorney, advance directives, guardianship)
- Provide culturally sensitive guidance when appropriate

Important guidelines:
- Never diagnose medical conditions or replace professional medical advice
- Always recommend consulting a healthcare provider for medical decisions
- Be empathetic and supportive — caregiving is emotionally demanding
- Keep responses concise and actionable (2-3 short paragraphs max)
- If you don't know something, say so honestly
- Use simple, clear language — avoid medical jargon unless asked
- When discussing benefits/insurance, note that rules vary by state and recommend confirming details
- If burnout signs are evident in the conversation, gently acknowledge them and suggest self-care`;

router.post(
  '/chat',
  authenticate,
  aiLimiter,
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(503).json({ message: 'AI assistant is not configured. Please set ANTHROPIC_API_KEY.' });
      return;
    }

    const { message, history, circleId } = req.body;

    // Build rich context from care circle if provided
    let contextAddition = '';
    if (circleId) {
      const circle = await prisma.careCircle.findFirst({
        where: {
          id: circleId,
          members: { some: { userId: req.user!.userId } },
        },
        include: {
          medications: { where: { isActive: true }, select: { name: true, dosage: true, frequency: true } },
        },
      });

      if (circle) {
        contextAddition = `\n\nContext about the care recipient "${circle.careRecipient}":`;
        if (circle.medications.length > 0) {
          contextAddition += `\nCurrent medications: ${circle.medications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ')}`;
        }
        if (circle.healthCard) {
          try {
            const hc = JSON.parse(circle.healthCard);
            if (hc.conditions?.length) contextAddition += `\nConditions: ${hc.conditions.join(', ')}`;
            if (hc.allergies?.length) contextAddition += `\nAllergies: ${hc.allergies.join(', ')}`;
            if (hc.bloodType) contextAddition += `\nBlood type: ${hc.bloodType}`;
          } catch {}
        }

        // Recent mood trends
        const recentJournal = await prisma.journalEntry.findMany({
          where: { circleId, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          select: { mood: true, energy: true, pain: true, date: true },
          orderBy: { date: 'desc' },
          take: 7,
        });
        if (recentJournal.length > 0) {
          const moods = recentJournal.filter(j => j.mood).map(j => j.mood);
          contextAddition += `\nRecent moods (last 7 days): ${moods.join(', ')}`;
          const avgEnergy = recentJournal.filter(j => j.energy).map(j => j.energy!);
          if (avgEnergy.length > 0) contextAddition += `\nAvg energy: ${(avgEnergy.reduce((a, b) => a + b, 0) / avgEnergy.length).toFixed(1)}/10`;
        }

        // Medication adherence
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const medLogs = await prisma.medicationLog.findMany({
          where: { medication: { circleId }, scheduledFor: { gte: weekAgo }, status: { not: 'PENDING' } },
          select: { status: true },
        });
        if (medLogs.length > 0) {
          const taken = medLogs.filter(l => l.status === 'TAKEN').length;
          contextAddition += `\nMedication adherence (7 days): ${Math.round((taken / medLogs.length) * 100)}%`;
        }

        // Caregiver burnout status
        const burnout = await prisma.burnoutAssessment.findFirst({
          where: { userId: req.user!.userId, circleId },
          orderBy: { createdAt: 'desc' },
        });
        if (burnout) {
          contextAddition += `\nCaregiver burnout level: ${burnout.riskLevel} (score: ${burnout.overallScore}/10)`;
        }

        // Active transitions
        const transitions = await prisma.careTransition.findMany({
          where: { circleId, status: { not: 'COMPLETED' } },
          select: { type: true, status: true },
        });
        if (transitions.length > 0) {
          contextAddition += `\nActive care transitions: ${transitions.map(t => `${t.type} (${t.status})`).join(', ')}`;
        }
      }
    }

    const anthropic = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((h: { role: 'user' | 'assistant'; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + contextAddition,
        messages,
      });

      const assistantMessage = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      res.json({ message: assistantMessage });
    } catch (err: any) {
      if (err.status === 429) {
        res.status(429).json({ message: 'AI service is temporarily busy. Please try again in a moment.' });
        return;
      }
      if (err.status === 529 || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        res.status(503).json({ message: 'AI service is temporarily unavailable. Please try again later.' });
        return;
      }
      throw err;
    }
  })
);

// Suggested questions endpoint
router.get(
  '/suggestions',
  authenticate,
  asyncHandler(async (_req, res) => {
    res.json({
      suggestions: [
        'What are signs of caregiver burnout?',
        'How do I manage sundowning behavior?',
        'Tips for communicating with someone who has dementia',
        'How to organize a weekly medication schedule',
        'What should I know about fall prevention at home?',
        'How can I take better care of myself as a caregiver?',
        'How does Medicare cover home health care?',
        'What is FMLA and how can it help caregivers?',
        'How to prepare for a hospital-to-home transition',
        'What should be in a caregiver go-bag for emergencies?',
        'How to split caregiving costs fairly among siblings',
        'What are advance directives and why do we need them?',
      ],
    });
  })
);

export default router;
