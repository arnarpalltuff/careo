import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('test1234', 12);

  // Create users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: {
      email: 'alice@test.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Johnson',
      subscriptionTier: 'FREE',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@test.com' },
    update: {},
    create: {
      email: 'bob@test.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Smith',
      subscriptionTier: 'FAMILY',
    },
  });

  // Create care circle
  const circle = await prisma.careCircle.create({
    data: {
      name: "Mom's Care Team",
      careRecipient: 'Margaret Johnson',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = new Date();

  await prisma.task.createMany({
    data: [
      {
        circleId: circle.id,
        title: 'Pick up prescription',
        description: 'From CVS on Main Street',
        priority: 'HIGH',
        dueDate: tomorrow,
        assignedToId: bob.id,
        createdById: alice.id,
      },
      {
        circleId: circle.id,
        title: 'Schedule dentist appointment',
        priority: 'MEDIUM',
        createdById: alice.id,
      },
      {
        circleId: circle.id,
        title: 'Buy groceries for Mom',
        description: 'Milk, bread, fruits, her favorite tea',
        priority: 'LOW',
        dueDate: today,
        assignedToId: alice.id,
        createdById: alice.id,
      },
    ],
  });

  // Create medications
  const lisinopril = await prisma.medication.create({
    data: {
      circleId: circle.id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Twice daily',
      instructions: 'Take with food',
      prescriber: 'Dr. Smith',
      schedules: {
        create: [
          { time: '08:00', label: 'Morning' },
          { time: '20:00', label: 'Evening' },
        ],
      },
    },
  });

  await prisma.medication.create({
    data: {
      circleId: circle.id,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Once daily',
      instructions: 'Take with breakfast',
      prescriber: 'Dr. Williams',
      schedules: {
        create: [{ time: '08:00', label: 'Morning' }],
      },
    },
  });

  // Create journal entries
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.journalEntry.createMany({
    data: [
      {
        circleId: circle.id,
        authorId: alice.id,
        date: today,
        mood: 'GOOD',
        energy: 3,
        pain: 2,
        sleep: 'Good',
        appetite: 'Normal',
        notes: 'Mom had a good day today. She enjoyed her walk in the garden and ate well at lunch.',
      },
      {
        circleId: circle.id,
        authorId: bob.id,
        date: yesterday,
        mood: 'OKAY',
        energy: 2,
        pain: 4,
        sleep: 'Fair',
        appetite: 'Reduced',
        notes: 'Mom seemed a bit tired today. She mentioned some knee pain but was in good spirits overall.',
      },
    ],
  });

  // Create appointment
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.appointment.create({
    data: {
      circleId: circle.id,
      title: 'Dr. Smith — Cardiology follow-up',
      location: '123 Medical Center Dr, Suite 200',
      date: nextWeek,
      time: '10:30',
      duration: 30,
      doctor: 'Dr. Smith',
      phone: '555-0123',
      notes: 'Bring latest blood work results',
      reminder: 60,
    },
  });

  console.log('Seed completed successfully');
  console.log(`  Alice: ${alice.id} (alice@test.com)`);
  console.log(`  Bob: ${bob.id} (bob@test.com)`);
  console.log(`  Circle: ${circle.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
