import { db } from '@hiveforge/database';
import { workerRuntime } from '@hiveforge/worker-runtime';

export class TaskExecutor {
  private queueTaskCallback?: (taskId: string) => Promise<void>;

  setQueueTaskCallback(callback: (taskId: string) => Promise<void>) {
    this.queueTaskCallback = callback;
  }

  async processTask(taskId: string): Promise<void> {
    try {
      // 1. Run the worker execution
      await workerRuntime.executeTask(taskId);

      // 2. Fetch the completed task details
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: { mission: true },
      });

      if (!task) return;

      // 3. Check for any dependent tasks that were waiting for this task
      const dependents = await db.taskDependency.findMany({
        where: { dependsOnTaskId: taskId },
        include: {
          task: {
            include: {
              dependencies: {
                include: { dependsOnTask: true },
              },
            },
          },
        },
      });

      // 4. Check if we should unblock dependent tasks
      for (const dep of dependents) {
        const dependentTask = dep.task;

        // Check if all prerequisites of the dependent task are now COMPLETED
        const allCompleted = dependentTask.dependencies.every(
          (d) => d.dependsOnTask.status === 'COMPLETED'
        );

        if (allCompleted && (dependentTask.status === 'WAITING_DEPENDENCIES' || dependentTask.status === 'PENDING')) {
          // Transition task status to QUEUED
          await db.task.update({
            where: { id: dependentTask.id },
            data: { status: 'QUEUED' },
          });

          await db.activity.create({
            data: {
              missionId: task.missionId,
              type: 'TASK_UNBLOCKED',
              message: `Task "${dependentTask.title}" has been unblocked and is now QUEUED.`,
            },
          });

          // Enqueue the task
          if (this.queueTaskCallback) {
            await this.queueTaskCallback(dependentTask.id);
          }
        }
      }

      // 5. Check if all tasks in the mission are now COMPLETED or FAILED
      const allMissionTasks = await db.task.findMany({
        where: { missionId: task.missionId },
      });

      const missionCompleted = allMissionTasks.every((t) => t.status === 'COMPLETED');
      const missionFailed = allMissionTasks.some((t) => t.status === 'FAILED');

      if (missionCompleted) {
        await db.mission.update({
          where: { id: task.missionId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await db.activity.create({
          data: {
            missionId: task.missionId,
            type: 'MISSION_COMPLETED',
            message: 'All tasks have completed successfully. Mission is COMPLETED!',
          },
        });
      } else if (missionFailed) {
        const activeTasks = allMissionTasks.some(
          (t) => t.status === 'RUNNING' || t.status === 'QUEUED' || t.status === 'RETRYING'
        );
        if (!activeTasks) {
          await db.mission.update({
            where: { id: task.missionId },
            data: { status: 'FAILED' },
          });

          await db.activity.create({
            data: {
              missionId: task.missionId,
              type: 'MISSION_FAILED',
              message: 'Task execution failed with no further active tasks. Mission is FAILED.',
            },
          });
        }
      }
    } catch (error: any) {
      console.error(`❌ Executor failed processing task ${taskId}:`, error);
    }
  }
}

export const executor = new TaskExecutor();
