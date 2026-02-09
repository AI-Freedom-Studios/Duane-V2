import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwt = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      await expect(service.register('test@test.com', 'password', 'Test')).rejects.toThrow(ConflictException);
    });

    it('should create user and return token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        role: 'MEMBER',
        createdAt: new Date(),
      });

      const result = await service.register('test@test.com', 'password123', 'Test');
      expect(result.accessToken).toBe('test-token');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });
});
