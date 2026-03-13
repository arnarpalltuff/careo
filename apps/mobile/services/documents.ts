import axios from 'axios';
import api from './api';

export const documentService = {
  getUploadUrl: (circleId: string, data: { fileName: string; mimeType: string; category: string }) =>
    api.post(`/circles/${circleId}/documents/upload-url`, data).then((r) => r.data),

  create: (circleId: string, data: { name: string; category: string; s3Key: string; mimeType: string; sizeBytes: number }) =>
    api.post(`/circles/${circleId}/documents`, data).then((r) => r.data),

  list: (circleId: string, category?: string) =>
    api.get(`/circles/${circleId}/documents`, { params: { category } }).then((r) => r.data),

  getDownloadUrl: (circleId: string, docId: string) =>
    api.get(`/circles/${circleId}/documents/${docId}/download-url`).then((r) => r.data),

  delete: (circleId: string, docId: string) =>
    api.delete(`/circles/${circleId}/documents/${docId}`).then((r) => r.data),

  uploadToS3: async (uploadUrl: string, file: { uri: string; mimeType: string }) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    await axios.put(uploadUrl, blob, {
      headers: { 'Content-Type': file.mimeType },
    });
  },
};
