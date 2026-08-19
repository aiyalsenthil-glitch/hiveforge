import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { db } from '@hiveforge/database';
import { planner } from '@hiveforge/planner';
import { scheduler } from '@hiveforge/scheduler';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    console.log('🏁 Initializing Task Queue Scheduler...');
    await scheduler.startScheduler();
  }

  async onModuleDestroy() {
    console.log('🛑 Stopping Task Queue Scheduler...');
    await scheduler.stopScheduler();
  }

  getData(): { message: string; usingInMemoryQueue: boolean } {
    return {
      message: 'HiveForge API Engine Online',
      usingInMemoryQueue: scheduler.isUsingInMemory(),
    };
  }

  async signInUser(email: string, isNewUser?: boolean) {
    // 1. Find or create Organization
    let org = await db.organization.findFirst({ where: { name: 'Demo Org' } });
    if (!org) {
      org = await db.organization.create({ data: { name: 'Demo Org' } });
    }

    // 2. Find or create User
    let user = await db.user.findUnique({ where: { email: email || 'demo@hiveforge.com' } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: email || 'demo@hiveforge.com',
          name: email ? email.split('@')[0] : 'Store Owner',
          passwordHash: 'hashed-password',
          organizationId: org.id,
        },
      });
    }

    if (isNewUser) {
      return {
        user,
        organization: org,
        workspace: null,
        hasStore: false,
      };
    }

    // 3. Find or create Workspace (Store)
    let workspace = await db.workspace.findFirst({
      where: { organizationId: org.id },
    });

    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          organizationId: org.id,
          name: 'Acme Retail & Store Hub',
          industry: 'Retail Store & Kids Utilities',
          description: 'Store Operations, POS Billing & AI Digital Workforce',
        },
      });

      await db.userRole.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
      }).catch(() => null);
    }

    return {
      user,
      organization: org,
      workspace,
      hasStore: true,
    };
  }

  async getWorkspace(workspaceId: string) {
    return db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        userRoles: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async createAndPlanMission(
    workspaceId: string,
    title: string,
    description: string,
    priority = 'MEDIUM',
    settings: any = null
  ) {
    // 1. Create a Draft Mission
    const mission = await db.mission.create({
      data: {
        workspaceId,
        title,
        description,
        priority,
        status: 'DRAFT',
        settings: settings || undefined,
      },
    });

    await db.activity.create({
      data: {
        missionId: mission.id,
        type: 'MISSION_CREATED',
        message: `Mission "${title}" created as a draft.`,
      },
    });

    // 2. Call Planner to decompose it into tasks
    const tasks = await planner.planMission(mission.id);

    // 3. Return the fully loaded planned mission
    const updatedMission = await db.mission.findUnique({
      where: { id: mission.id },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
        },
      },
    });

    return {
      mission: updatedMission,
      tasksCount: tasks.length,
    };
  }

  async runMission(missionId: string) {
    await scheduler.triggerMissionExecution(missionId);
    return { success: true, message: 'Mission execution successfully started.' };
  }

  async getMission(missionId: string) {
    return db.mission.findUnique({
      where: { id: missionId },
      include: {
        tasks: {
          include: {
            dependencies: {
              select: { dependsOnTaskId: true },
            },
            assignments: true,
            artifacts: {
              include: {
                versions: {
                  orderBy: { version: 'desc' },
                  take: 1,
                },
              },
            },
            logs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getLatestActivities(workspaceId: string, limit = 20) {
    return db.activity.findMany({
      where: {
        mission: {
          workspaceId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listMissions(workspaceId: string) {
    return db.mission.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });
  }

  async listProducts(workspaceId: string) {
    return (db as any).product.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(
    workspaceId: string,
    data: { name: string; category: string; costPrice: number; sellingPrice: number; stock: number; minStockLevel?: number; sku?: string; barcode?: string }
  ) {
    const sku = data.sku || `SKU-${Date.now()}`;
    return (db as any).product.create({
      data: {
        workspaceId,
        sku,
        name: data.name,
        category: data.category,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        stock: data.stock,
        minStockLevel: data.minStockLevel ?? 5,
        barcode: data.barcode || undefined,
      },
    });
  }

  async processCheckout(
    workspaceId: string,
    data: { items: any[]; subtotal: number; discount: number; tax: number; totalAmount: number; paymentMethod: string; customerName?: string; customerPhone?: string }
  ) {
    const invoiceNo = `INV-${Date.now()}`;

    // 1. Create Sale Record
    const sale = await (db as any).sale.create({
      data: {
        workspaceId,
        invoiceNo,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
      },
    });

    // 2. Decrement product stock levels
    for (const item of data.items) {
      if (item.productId) {
        await (db as any).product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        }).catch(() => null);
      }
    }

    return sale;
  }

  async getSalesSummary(workspaceId: string) {
    const sales = await (db as any).sale.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = sales.reduce((acc: number, s: any) => acc + s.totalAmount, 0);
    const totalTransactions = sales.length;

    return {
      sales,
      totalRevenue,
      totalTransactions,
    };
  }
}
