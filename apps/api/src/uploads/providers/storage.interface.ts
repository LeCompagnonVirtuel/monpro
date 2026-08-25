export interface StorageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface IStorageProvider {
  upload(file: StorageFile, folder: string): Promise<string>;
  delete(path: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
