import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '@hiveforge/config';
import { executor } from '@hiveforge/executor';
import { db } from '@hiveforge/database';

export class TaskScheduler {
  private redisConnection?: Redis;
  private taskQueue?: Queue;
  private taskWorker?: Worker;
  private useInMemory = true;

  constructor() {
    // Register the callback in the executor so that it can enqueue subsequent tasks
    executor.setQueueTaskCallback(async (taskId) => {
      await this.queueTask(taskId);
    });
  }

  async startScheduler(): Promise<void> {
    try {
      console.log(`🔌 Attempting to connect to Redis for BullMQ at: ${config.REDIS_URL}`);
      
      // Setup a connection with a short timeout to fail fast if Redis is offline
      this.redisConnection = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 2) {
            // Stop retrying and fall back to in-memory mode
            return null;
          }
          return Math.min(times * 100, 1000);
        }
      });

      // Handle connection error event
      this.redisConnection.on('error', (err) => {
        if (this.useInMemory) return; // Ignore if already fell back
        console.warn('⚠️ Redis connection error. Falling back to In-Memory Queue Mode:', err.message);
        this.useInMemory = true;
      });

      // Wait briefly for connection
      await new Promise<void>((resolve, reject) => {
        const conn = this.redisConnection!;
        if (conn.status === 'ready') {
          this.useInMemory = false;
          resolve();
        } else {
          conn.once('ready', () => {
            this.useInMemory = false;
            resolve();
          });
          conn.once('error', (err) => {
            reject(err);
          });
        }
      });

      if (!this.useInMemory) {
        console.log('✅ Connected to Redis successfully. Initializing BullMQ.');
        this.taskQueue = new Queue('task-queue', { connection: this.redisConnection as any });
        this.taskWorker = new Worker(
          'task-queue',
          async (job) => {
            const { taskId } = job.data;
            console.log(`🤖 [BullMQ] Worker picked up task: ${taskId}`);
            await executor.processTask(taskId);
          },
          { connection: this.redisConnection as any, concurrency: 4 }
        );

        this.taskWorker.on('failed', (job, err) => {
          console.error(`❌ [BullMQ] Job ${job?.id} failed:`, err);
        });
      }
    } catch (err: any) {
      console.warn('⚠️ Could not initialize Redis Queue. Running in In-Memory Queue Mode.', err.message);
      this.useInMemory = true;
    }
  }

  async queueTask(taskId: string): Promise<void> {
    // 1. Update status to QUEUED in the DB
    await db.task.update({
      where: { id: taskId },
      data: { status: 'QUEUED' }
    });

    if (!this.useInMemory && this.taskQueue) {
      console.log(`📥 Enqueuing task ${taskId} into BullMQ.`);
      await this.taskQueue.add('execute-task', { taskId });
    } else {
      console.log(`📥 Enqueuing task ${taskId} into In-Memory Async Executor.`);
      // Run asynchronously using process.nextTick to simulate queue execution
      process.nextTick(async () => {
        try {
          await executor.processTask(taskId);
        } catch (error) {
          console.error(`❌ In-Memory Executor failed on task ${taskId}:`, error);
        }
      });
    }
  }

  async triggerMissionExecution(missionId: string): Promise<void> {
    // Find all tasks for this mission that have NO dependencies
    const independentTasks = await db.task.findMany({
      where: {
        missionId,
        dependencies: {
          none: {}
        }
      }
    });

    if (independentTasks.length === 0) {
      throw new Error(`Mission ${missionId} has no entrypoint tasks (all tasks have dependencies).`);
    }

    // Update Mission status to RUNNING
    await db.mission.update({
      where: { id: missionId },
      data: { status: 'RUNNING' }
    });

    await db.activity.create({
      data: {
        missionId,
        type: 'MISSION_STARTED',
        message: `Execution phase started. Enqueuing ${independentTasks.length} root tasks.`
      }
    });

    // Enqueue all independent entrypoint tasks
    for (const task of independentTasks) {
      await this.queueTask(task.id);
    }
  }

  async stopScheduler(): Promise<void> {
    if (this.taskWorker) {
      await this.taskWorker.close();
    }
    if (this.taskQueue) {
      await this.taskQueue.close();
    }
    if (this.redisConnection) {
      this.redisConnection.disconnect();
    }
  }

  isUsingInMemory(): boolean {
    return this.useInMemory;
  }
}

export const scheduler = new TaskScheduler();
export type { Queue, Worker };
