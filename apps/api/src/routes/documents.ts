import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as docService from '../services/documents';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  category: z.enum(['INSURANCE', 'PRESCRIPTION', 'LEGAL', 'MEDICAL', 'ID', 'OTHER']),
});

const createDocSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['INSURANCE', 'PRESCRIPTION', 'LEGAL', 'MEDICAL', 'ID', 'OTHER']),
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
});

router.post(
  '/upload-url',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(uploadUrlSchema),
  asyncHandler(async (req, res) => {
    const result = await docService.getUploadUrl(req.params.circleId, req.user!.userId, req.body);
    res.json(result);
  })
);

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createDocSchema),
  asyncHandler(async (req, res) => {
    const document = await docService.createDocument(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ document });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const documents = await docService.getDocuments(req.params.circleId, req.query.category as any);
    res.json({ documents });
  })
);

router.get(
  '/:docId/download-url',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await docService.getDownloadUrl(req.params.docId, req.params.circleId);
    res.json(result);
  })
);

router.delete(
  '/:docId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await docService.deleteDocument(
      req.params.docId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Document deleted' });
  })
);

export default router;
