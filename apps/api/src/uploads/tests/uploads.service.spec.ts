import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from '../uploads.service';
import { STORAGE_PROVIDER } from '../providers/storage.interface';

describe('UploadsService — Path Traversal & Security', () => {
  let service: UploadsService;
  const mockStorage = {
    upload: jest.fn().mockImplementation((_file, folder) => {
      return Promise.resolve(`/uploads/${folder}/${_file.filename}`);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: STORAGE_PROVIDER, useValue: mockStorage },
      ],
    }).compile();

    service = module.get(UploadsService);
    jest.clearAllMocks();
    mockStorage.upload.mockImplementation((_file, folder) => {
      return Promise.resolve(`/uploads/${folder}/${_file.filename}`);
    });
  });

  const validFile = {
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    size: 1024,
    originalname: 'photo.jpg',
  } as Express.Multer.File;

  describe('folder whitelist', () => {
    it('should reject path traversal via "../"', async () => {
      await expect(service.uploadFile(validFile, '../etc'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject path traversal via "../../"', async () => {
      await expect(service.uploadFile(validFile, '../../root'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject absolute paths', async () => {
      await expect(service.uploadFile(validFile, '/etc/passwd'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject unwhitelisted folders', async () => {
      await expect(service.uploadFile(validFile, 'secret'))
        .rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(validFile, 'admin'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject encoded traversal "%2e%2e"', async () => {
      await expect(service.uploadFile(validFile, '%2e%2e'))
        .rejects.toThrow(BadRequestException);
    });

    it('should accept whitelisted folder "avatars"', async () => {
      const result = await service.uploadFile(validFile, 'avatars');
      expect(result).toMatch(/^\/uploads\/avatars\/[a-f0-9-]+\.jpg$/);
    });

    it('should accept whitelisted folder "services"', async () => {
      const result = await service.uploadFile(validFile, 'services');
      expect(result).toMatch(/^\/uploads\/services\/[a-f0-9-]+\.jpg$/);
    });

    it('should accept whitelisted folder "kyc"', async () => {
      const result = await service.uploadFile(validFile, 'kyc');
      expect(result).toMatch(/^\/uploads\/kyc\/[a-f0-9-]+\.jpg$/);
    });
  });

  describe('MIME validation', () => {
    it('should reject non-image MIME types', async () => {
      const malicious = { ...validFile, mimetype: 'application/javascript' };
      await expect(service.uploadFile(malicious as any, 'avatars'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject text/html', async () => {
      const html = { ...validFile, mimetype: 'text/html' };
      await expect(service.uploadFile(html as any, 'avatars'))
        .rejects.toThrow(BadRequestException);
    });

    it('should accept image/jpeg', async () => {
      const result = await service.uploadFile(validFile, 'avatars');
      expect(result).toBeDefined();
    });

    it('should accept image/png', async () => {
      const png = { ...validFile, mimetype: 'image/png', originalname: 'photo.png' };
      const result = await service.uploadFile(png as any, 'avatars');
      expect(result).toMatch(/\.png$/);
    });
  });

  describe('file size', () => {
    it('should reject files larger than 5MB', async () => {
      const large = { ...validFile, size: 6 * 1024 * 1024 };
      await expect(service.uploadFile(large as any, 'avatars'))
        .rejects.toThrow(BadRequestException);
      await expect(service.uploadFile(large as any, 'avatars'))
        .rejects.toThrow('trop volumineux');
    });

    it('should accept files under 5MB', async () => {
      const small = { ...validFile, size: 4 * 1024 * 1024 };
      const result = await service.uploadFile(small as any, 'avatars');
      expect(result).toBeDefined();
    });
  });

  describe('filename security', () => {
    it('should generate UUID filename, ignoring user-provided name', async () => {
      const maliciousName = { ...validFile, originalname: '../../../etc/passwd.jpg' };
      const result = await service.uploadFile(maliciousName as any, 'avatars');
      expect(result).not.toContain('..');
      expect(result).toMatch(/^\/uploads\/avatars\/[a-f0-9-]+\.jpg$/);
    });

    it('should sanitize double extensions', async () => {
      const doubleExt = { ...validFile, originalname: 'shell.php.jpg' };
      const result = await service.uploadFile(doubleExt as any, 'avatars');
      expect(result).toMatch(/\.jpg$/);
      expect(result).not.toContain('.php');
    });

    it('should reject disallowed extensions by defaulting to .jpg', async () => {
      const exe = { ...validFile, originalname: 'virus.exe' };
      const result = await service.uploadFile(exe as any, 'avatars');
      expect(result).toMatch(/\.jpg$/);
    });
  });

  describe('no file', () => {
    it('should reject null file', async () => {
      await expect(service.uploadFile(null as any, 'avatars'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
