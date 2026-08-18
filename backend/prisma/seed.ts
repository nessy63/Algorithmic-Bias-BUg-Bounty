import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Create companies
  const company1 = await prisma.company.create({
    data: {
      name: 'TechAI Corp',
      slug: 'techai-corp',
      description: 'Leading AI company developing language models',
      website: 'https://techai.example.com',
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'VisionML Inc',
      slug: 'visionml-inc',
      description: 'Computer vision and image recognition company',
      website: 'https://visionml.example.com',
    },
  });

  // Create researchers
  const researcher1 = await prisma.researcher.create({
    data: {
      bio: 'AI safety researcher with focus on bias detection',
      reputation: 150,
      totalEarnings: 2500,
    },
  });

  const researcher2 = await prisma.researcher.create({
    data: {
      bio: 'Machine learning engineer specializing in fairness',
      reputation: 85,
      totalEarnings: 1200,
    },
  });

  // Create users
  const companyUser1 = await prisma.user.create({
    data: {
      email: 'admin@techai.example.com',
      passwordHash,
      name: 'John Smith',
      role: 'COMPANY',
      companyId: company1.id,
    },
  });

  const companyUser2 = await prisma.user.create({
    data: {
      email: 'admin@visionml.example.com',
      passwordHash,
      name: 'Jane Doe',
      role: 'COMPANY',
      companyId: company2.id,
    },
  });

  const researcherUser1 = await prisma.user.create({
    data: {
      email: 'researcher1@example.com',
      passwordHash,
      name: 'Alice Johnson',
      role: 'RESEARCHER',
      researcherId: researcher1.id,
    },
  });

  const researcherUser2 = await prisma.user.create({
    data: {
      email: 'researcher2@example.com',
      passwordHash,
      name: 'Bob Wilson',
      role: 'RESEARCHER',
      researcherId: researcher2.id,
    },
  });

  // Create AI models
  const model1 = await prisma.aIModel.create({
    data: {
      name: 'TechAI-LLM-v2',
      description: 'Large language model for text generation and analysis',
      version: '2.1.0',
      category: 'NLP',
      companyId: company1.id,
    },
  });

  const model2 = await prisma.aIModel.create({
    data: {
      name: 'VisionML-Detector',
      description: 'Object detection model for autonomous vehicles',
      version: '3.0.2',
      category: 'Computer Vision',
      companyId: company2.id,
    },
  });

  // Create bounties
  const bounty1 = await prisma.bounty.create({
    data: {
      title: 'Gender Bias in Hiring Recommendations',
      description: 'Find instances where the model shows gender bias in job recommendation scenarios',
      amount: 5000,
      maxPayout: 5000,
      severity: 'HIGH',
      companyId: company1.id,
      modelId: model1.id,
    },
  });

  const bounty2 = await prisma.bounty.create({
    data: {
      title: 'Racial Bias in Image Classification',
      description: 'Identify racial bias in face detection and classification',
      amount: 10000,
      maxPayout: 10000,
      severity: 'CRITICAL',
      companyId: company2.id,
      modelId: model2.id,
    },
  });

  const bounty3 = await prisma.bounty.create({
    data: {
      title: 'Age Bias in Content Moderation',
      description: 'Find age-related bias in content filtering decisions',
      amount: 2500,
      maxPayout: 2500,
      severity: 'MEDIUM',
      companyId: company1.id,
      modelId: model1.id,
    },
  });

  // Create sample bug reports
  await prisma.bugReport.create({
    data: {
      title: 'Gender bias in resume screening',
      description: 'The model consistently ranks male candidates higher for technical roles',
      reproductionSteps: '1. Submit resumes with identical qualifications\n2. Vary only the gender indicators\n3. Compare rankings',
      inputExample: 'Resume A: "John Smith, Software Engineer..." vs Resume B: "Jane Smith, Software Engineer..."',
      expectedBehavior: 'Equal ranking regardless of gender',
      actualBehavior: 'Male candidates ranked 20% higher on average',
      severity: 'HIGH',
      researcherId: researcher1.id,
      modelId: model1.id,
      bountyId: bounty1.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Companies:', company1.name, company2.name);
  // Emails and passwords are personal data — never print them to the console.
  console.log('Researchers: [REDACTED]');
  console.log('Password for all accounts: [REDACTED]');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
