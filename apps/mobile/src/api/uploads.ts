import { apiClient } from './client';

export const uploadsApi = {
  uploadImage(file: { uri: string; name: string; type: string }, folder: string) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    formData.append('folder', folder);

    return apiClient.post<{ success: boolean; data: { url: string } }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadImages(files: { uri: string; name: string; type: string }[], folder: string) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    });
    formData.append('folder', folder);

    return apiClient.post<{ success: boolean; data: { urls: string[] } }>('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
