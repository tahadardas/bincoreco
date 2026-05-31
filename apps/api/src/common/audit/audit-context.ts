import { AuthenticatedRequest } from '../auth/authenticated-request.type';
import { AuditLogContext } from '../../modules/audit-logs/audit-log.types';

export function getAuditContext(req: AuthenticatedRequest): AuditLogContext {
  return {
    actorUserId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };
}
