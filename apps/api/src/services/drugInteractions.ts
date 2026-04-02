import Anthropic from '@anthropic-ai/sdk';
import { SubscriptionTier, TIER_LIMITS, DrugInteraction, InteractionSeverity } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

const anthropic = new Anthropic();

export async function checkInteractions(
  circleId: string,
  userId: string
): Promise<DrugInteraction[]> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].drugInteractions) {
    throw new AppError(403, 'upgrade_required', 'Drug interaction checking requires a Plus or Family subscription.');
  }

  const medications = await prisma.medication.findMany({
    where: { circleId, isActive: true },
    select: { name: true, dosage: true },
  });

  if (medications.length < 2) {
    return [];
  }

  const medList = medications.map((m) => `${m.name} (${m.dosage})`).join(', ');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a pharmacology expert. Analyze the following medications for potential drug-drug interactions.

Medications: ${medList}

Respond with a JSON array of interactions. Each interaction should have:
- "medication1": name of first drug
- "medication2": name of second drug
- "severity": one of "LOW", "MODERATE", "SEVERE", "CONTRAINDICATED"
- "description": brief description of the interaction
- "recommendation": what the caregiver should do

If there are no interactions, return an empty array [].
Respond ONLY with the JSON array, no other text.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    const interactions: DrugInteraction[] = JSON.parse(content.text);
    return interactions;
  } catch {
    return [];
  }
}

export async function checkNewMedication(
  circleId: string,
  userId: string,
  newMedName: string
): Promise<DrugInteraction[]> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].drugInteractions) {
    throw new AppError(403, 'upgrade_required', 'Drug interaction checking requires a Plus or Family subscription.');
  }

  const medications = await prisma.medication.findMany({
    where: { circleId, isActive: true },
    select: { name: true, dosage: true },
  });

  if (medications.length === 0) {
    return [];
  }

  const medList = medications.map((m) => `${m.name} (${m.dosage})`).join(', ');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a pharmacology expert. A patient is currently taking: ${medList}

A new medication is being considered: ${newMedName}

Check for potential drug interactions between the new medication and each existing medication.

Respond with a JSON array of interactions. Each interaction should have:
- "medication1": "${newMedName}"
- "medication2": name of the existing drug it interacts with
- "severity": one of "LOW", "MODERATE", "SEVERE", "CONTRAINDICATED"
- "description": brief description of the interaction
- "recommendation": what the caregiver should do

If there are no interactions, return an empty array [].
Respond ONLY with the JSON array, no other text.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    const interactions: DrugInteraction[] = JSON.parse(content.text);
    return interactions;
  } catch {
    return [];
  }
}
