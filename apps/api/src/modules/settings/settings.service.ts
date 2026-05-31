import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActions, AuditLogContext } from '../audit-logs/audit-log.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async set(key: string, value: string, auditContext?: AuditLogContext) {
    const before = await this.prisma.setting.findUnique({ where: { key } });
    const after = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.SETTING_CHANGED,
      entityType: 'Setting',
      entityId: key,
      beforeSnapshot: before,
      afterSnapshot: after,
    });

    return after;
  }

  async getAll() {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async getPublicBrandSettings(): Promise<Record<string, string | null>> {
    const allowedKeys: string[] = [
      'brand_logo_main',
      'brand_logo_dark',
      'brand_logo_light',
      'brand_mark',
      'brand_favicon',
      'brand_fallback_image',
      'brand_pattern',
      'brand_footer_logo',
      'brand_pattern_opacity',
      'contact_phone',
      'contact_whatsapp',
      'contact_address',
      'contact_hours',
      'contact_instagram',
      'contact_email',
    ];
    const aboutKeys = [
      'about_hero_title', 'about_hero_sub',
      'about_story_title', 'about_story_p1', 'about_story_p2',
      'about_philosophy_title', 'about_philosophy_p1', 'about_philosophy_p2',
      'about_maestro_title', 'about_maestro_p1',
      'about_experience_title', 'about_experience_p1', 'about_experience_p2', 'about_experience_p3', 'about_experience_p4',
      'about_cta_title', 'about_cta_sub',
      'about_order_now', 'about_view_products',
    ];
    for (const k of aboutKeys) {
      allowedKeys.push(`${k}_ar`, `${k}_en`);
    }
    const contactKeys = [
      'contact_hero_title', 'contact_hero_sub',
      'contact_form_title', 'contact_map_title',
      'contact_success_msg', 'contact_cta_order', 'contact_cta_whatsapp',
    ];
    for (const k of contactKeys) {
      allowedKeys.push(`${k}_ar`, `${k}_en`);
    }
    const keys = await this.prisma.setting.findMany({
      where: { key: { in: allowedKeys } },
    });
    const result: Record<string, string | null> = {};
    for (const key of allowedKeys) {
      const found = keys.find(s => s.key === key);
      result[key] = found?.value ?? null;
    }
    return result;
  }

  async remove(key: string, auditContext?: AuditLogContext) {
    const before = await this.prisma.setting.findUnique({ where: { key } });
    await this.prisma.setting.delete({ where: { key } }).catch(() => {});
    await this.auditLogs.record({
      ...auditContext,
      action: AuditActions.SETTING_CHANGED,
      entityType: 'Setting',
      entityId: key,
      beforeSnapshot: before,
      afterSnapshot: null,
    });
  }
}
