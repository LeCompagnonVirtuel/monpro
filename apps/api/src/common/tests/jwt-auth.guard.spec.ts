import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard — Global Guard Behavior', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(isPublic: boolean) {
    const mockHandler = jest.fn();
    const mockClass = jest.fn();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    return {
      getHandler: () => mockHandler,
      getClass: () => mockClass,
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
        getResponse: () => ({}),
      }),
    } as any;
  }

  describe('Public endpoints', () => {
    it('should ALLOW access when @Public() is present (returns true immediately)', () => {
      const context = createMockContext(true);
      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should check reflector with correct metadata key', () => {
      const context = createMockContext(true);
      guard.canActivate(context);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'isPublic',
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('Protected endpoints', () => {
    it('should NOT return true when @Public() is absent (delegates to passport)', () => {
      const context = createMockContext(false);
      // Mock super.canActivate to avoid passport strategy error in unit test
      const superCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivate.mockReturnValue(Promise.resolve(false));

      const result = guard.canActivate(context);
      // Should NOT return true directly — it delegates
      expect(result).not.toBe(true);
      superCanActivate.mockRestore();
    });
  });

  describe('Guard is registered globally in AppModule', () => {
    it('should be configured as APP_GUARD (source verification)', () => {
      const fs = require('fs');
      const path = require('path');
      const appModulePath = path.join(__dirname, '../../app.module.ts');
      const content = fs.readFileSync(appModulePath, 'utf-8');

      expect(content).toContain('APP_GUARD');
      expect(content).toContain('JwtAuthGuard');
      expect(content).toMatch(/provide:\s*APP_GUARD.*useClass:\s*JwtAuthGuard/s);
    });
  });

  describe('Public controllers have @Public decorator', () => {
    it('should verify all public controllers import and use @Public()', () => {
      const fs = require('fs');
      const path = require('path');
      const baseDir = path.join(__dirname, '../..');

      const publicControllers = [
        'health.controller.ts',
        'auth/auth.controller.ts',
        'categories/categories.controller.ts',
        'services/services.controller.ts',
        'professionals/professionals.controller.ts',
        'geography/geography.controller.ts',
      ];

      for (const controller of publicControllers) {
        const filePath = path.join(baseDir, controller);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('@Public()');
        expect(content).toContain("import { Public }");
      }
    });

    it('should verify bookings controller is NOT public', () => {
      const fs = require('fs');
      const path = require('path');
      const baseDir = path.join(__dirname, '../..');
      const content = fs.readFileSync(path.join(baseDir, 'bookings/bookings.controller.ts'), 'utf-8');
      expect(content).not.toContain('@Public()');
    });

    it('should verify only payments webhook is public', () => {
      const fs = require('fs');
      const path = require('path');
      const baseDir = path.join(__dirname, '../..');
      const content = fs.readFileSync(path.join(baseDir, 'payments/payments.controller.ts'), 'utf-8');
      const publicMatches = content.match(/@Public\(\)/g);
      expect(publicMatches?.length).toBe(1);
    });
  });
});
