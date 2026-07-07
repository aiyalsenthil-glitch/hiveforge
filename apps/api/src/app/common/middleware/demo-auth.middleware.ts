import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { db } from '@hiveforge/database';
import { TelemetryRequest } from './request-id.middleware';

export interface AuthenticatedRequest extends TelemetryRequest {
  userId: string;
  workspaceId: string;
}

@Injectable()
export class DemoAuthMiddleware implements NestMiddleware {
  private demoUser: any = null;
  private demoWorkspace: any = null;

  async use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    try {
      if (!this.demoUser || !this.demoWorkspace) {
        // 1. Ensure Demo Organization exists
        let org = await db.organization.findFirst({
          where: { name: 'Demo Org' }
        });
        if (!org) {
          org = await db.organization.create({
            data: { name: 'Demo Org' }
          });
        }

        // 2. Ensure Demo User exists
        let user = await db.user.findUnique({
          where: { email: 'demo@hiveforge.com' }
        });
        if (!user) {
          user = await db.user.create({
            data: {
              email: 'demo@hiveforge.com',
              name: 'Senthil',
              passwordHash: 'demo-password-hash',
              organizationId: org.id
            }
          });
        }
        this.demoUser = user;

        // 3. Ensure Demo Workspace exists
        let workspace = await db.workspace.findFirst({
          where: { organizationId: org.id, name: 'Acme Retail' }
        });
        if (!workspace) {
          workspace = await db.workspace.create({
            data: {
              organizationId: org.id,
              name: 'Acme Retail',
              industry: 'Retail',
              description: 'Stationery & Kids Store'
            }
          });

          // Create Workspace role for user
          await db.userRole.create({
            data: {
              userId: user.id,
              workspaceId: workspace.id,
              role: 'ADMIN'
            }
          });
        }
        this.demoWorkspace = workspace;
      }

      // Attach user and workspace context to request
      req.userId = this.demoUser.id;
      req.workspaceId = this.demoWorkspace.id;
    } catch (err) {
      console.error('❌ Error seeding/loading demo database context:', err);
    }

    next();
  }
}
