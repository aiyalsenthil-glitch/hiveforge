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
}
