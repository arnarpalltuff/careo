import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocCategory, SubscriptionTier, TIER_LIMITS } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'careo-documents';

export async function getUploadUrl(
  circleId: string,
  userId: string,
  data: { fileName: string; mimeType: string; category: DocCategory }
) {
  // Check document limit
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const docCount = await prisma.document.count({ where: { circleId } });
  const limit = TIER_LIMITS[tier].docs;
  if (docCount >= limit) {
    throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} documents. Upgrade to store more.`);
  }

  const s3Key = `circles/${circleId}/documents/${Date.now()}-${data.fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: data.mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  return { uploadUrl, s3Key };
}

export async function createDocument(
  circleId: string,
  uploadedById: string,
  data: { name: string; category: DocCategory; s3Key: string; mimeType: string; sizeBytes: number }
) {
  return prisma.document.create({
    data: {
      circleId,
      uploadedById,
      name: data.name,
      category: data.category,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    },
  });
}

export async function getDocuments(circleId: string, category?: DocCategory) {
  const where: any = { circleId };
  if (category) where.category = category;

  return prisma.document.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDownloadUrl(docId: string, circleId: string) {
  const doc = await prisma.document.findFirst({ where: { id: docId, circleId } });
  if (!doc) throw new AppError(404, 'not_found', 'Document not found');

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: doc.s3Key });
  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { downloadUrl };
}

export async function deleteDocument(docId: string, circleId: string, userId: string, userRole: string) {
  const doc = await prisma.document.findFirst({ where: { id: docId, circleId } });
  if (!doc) throw new AppError(404, 'not_found', 'Document not found');

  if (userRole !== 'ADMIN' && doc.uploadedById !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the uploader can delete documents');
  }

  await prisma.document.delete({ where: { id: docId } });
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.s3Key }));
}
