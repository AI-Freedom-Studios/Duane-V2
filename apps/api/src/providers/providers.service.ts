import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRegistry } from './provider-registry';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';
import { encrypt, decrypt } from '../common/crypto';

@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    private registry: ProviderRegistry,
    private audit: AuditService,
  ) {}

  getAvailableProviders() {
    return this.registry.getAll().map(({ testFn, ...rest }) => rest);
  }

  async getUserKeys(userId: string) {
    const keys = await this.prisma.providerKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      providerSlug: k.providerSlug,
      label: k.label,
      lastTestedAt: k.lastTestedAt?.toISOString() || null,
      lastTestStatus: k.lastTestStatus,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    }));
  }

  async addKey(userId: string, providerSlug: string, label: string, apiKey: string, additionalFields?: Record<string, string>, ip?: string) {
    const provider = this.registry.get(providerSlug);
    if (!provider) throw new BadRequestException(`Unknown provider: ${providerSlug}`);

    const encryptedKey = encrypt(apiKey);
    const encryptedFields = additionalFields ? encrypt(JSON.stringify(additionalFields)) : null;

    const key = await this.prisma.providerKey.create({
      data: { userId, providerSlug, label, encryptedKey, encryptedFields },
    });

    await this.audit.log(userId, AuditAction.PROVIDER_KEY_ADD, { providerSlug, label }, ip);

    return {
      id: key.id,
      providerSlug: key.providerSlug,
      label: key.label,
      lastTestedAt: null,
      lastTestStatus: null,
      createdAt: key.createdAt.toISOString(),
      updatedAt: key.updatedAt.toISOString(),
    };
  }

  async updateKey(userId: string, keyId: string, data: { label?: string; apiKey?: string; additionalFields?: Record<string, string> }, ip?: string) {
    const key = await this.prisma.providerKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    const updateData: any = {};
    if (data.label) updateData.label = data.label;
    if (data.apiKey) updateData.encryptedKey = encrypt(data.apiKey);
    if (data.additionalFields) updateData.encryptedFields = encrypt(JSON.stringify(data.additionalFields));

    const updated = await this.prisma.providerKey.update({ where: { id: keyId }, data: updateData });
    await this.audit.log(userId, AuditAction.PROVIDER_KEY_UPDATE, { keyId, providerSlug: key.providerSlug }, ip);

    return {
      id: updated.id,
      providerSlug: updated.providerSlug,
      label: updated.label,
      lastTestedAt: updated.lastTestedAt?.toISOString() || null,
      lastTestStatus: updated.lastTestStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteKey(userId: string, keyId: string, ip?: string) {
    const key = await this.prisma.providerKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    await this.prisma.providerKey.delete({ where: { id: keyId } });
    await this.audit.log(userId, AuditAction.PROVIDER_KEY_DELETE, { keyId, providerSlug: key.providerSlug }, ip);
  }

  async testKey(userId: string, keyId: string, ip?: string) {
    const key = await this.prisma.providerKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    const provider = this.registry.get(key.providerSlug);
    if (!provider || !provider.testFn) {
      await this.prisma.providerKey.update({
        where: { id: keyId },
        data: { lastTestedAt: new Date(), lastTestStatus: null },
      });
      return { success: null, message: 'No test available for this provider' };
    }

    const decryptedKey = decrypt(key.encryptedKey);
    let fields: Record<string, string> | undefined;
    if (key.encryptedFields) {
      fields = JSON.parse(decrypt(key.encryptedFields));
    }

    let success = false;
    try {
      success = await provider.testFn(decryptedKey, fields);
    } catch {
      success = false;
    }

    await this.prisma.providerKey.update({
      where: { id: keyId },
      data: { lastTestedAt: new Date(), lastTestStatus: success },
    });

    await this.audit.log(userId, AuditAction.PROVIDER_KEY_TEST, { keyId, providerSlug: key.providerSlug, success }, ip);

    return { success, message: success ? 'Connection successful' : 'Connection failed' };
  }
}
