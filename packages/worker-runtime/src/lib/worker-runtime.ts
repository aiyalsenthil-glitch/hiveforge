import { db } from '@hiveforge/database';
import { ai } from '@hiveforge/ai-runtime';

export class WorkerRuntime {
  async executeTask(taskId: string): Promise<any> {
    const startTime = Date.now();

    // 1. Fetch Task and Mission details
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        mission: true,
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found.`);
    }

    // 2. Set task status to RUNNING & create assignment log
    await db.task.update({
      where: { id: taskId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const assignment = await db.workerAssignment.create({
      data: {
        taskId,
        workerType: task.workerType,
        status: 'EXECUTING',
        startedAt: new Date(),
      },
    });

    await db.activity.create({
      data: {
        missionId: task.missionId,
        type: 'TASK_STARTED',
        message: `Task "${task.title}" is now running under specialized "${task.workerType}" Worker.`,
      },
    });

    await db.executionLog.create({
      data: {
        taskId,
        logType: 'stdout',
        message: `Initializing execution for worker: ${task.workerType}. Target Goal: ${task.title}`,
      },
    });

    // 3. Aggregate outputs from dependency tasks for pipeline context
    let contextFromParents = '';
    if (task.dependencies.length > 0) {
      contextFromParents = '\n### Context from completed prerequisite tasks:\n';
      for (const dep of task.dependencies) {
        const parentTask = dep.dependsOnTask;
        contextFromParents += `\n--- Prerequisite Task: ${parentTask.title} (${parentTask.workerType}) ---\n`;
        contextFromParents += `Output Content:\n${
          typeof parentTask.output === 'string'
            ? parentTask.output
            : JSON.stringify(parentTask.output, null, 2)
        }\n---------------------------------------\n`;
      }
    }

    // 4. Resolve prompts based on workerType
    let workerPrompt = '';
    let artifactType = 'TEXT_REPORT';

    switch (task.workerType.toLowerCase()) {
      case 'research':
        artifactType = 'RESEARCH_REPORT';
        workerPrompt = `You are a Research Agent. Your job is to conduct comprehensive market, competitor, and customer research.
Analyze trends, identify gaps, and deliver actionable intelligence.

Mission Goal: ${task.mission.title} - ${task.mission.description}
Current Task: ${task.title}
Task Details: ${task.description || ''}
Inputs: ${JSON.stringify(task.input || {})}
${contextFromParents}

Deliver a beautifully structured markdown report detailing:
- Market size & demand trends
- Competitor SWOT analysis & gaps
- Target audience preferences and segment opportunities
- Product assortment recommendations.`;
        break;

      case 'finance':
        artifactType = 'FINANCE_PLAN';
        workerPrompt = `You are a Finance & Pricing Agent. Your job is to calculate budgets, cost sheets, pricing plans, and margins.
Ensure profitability and efficient resource allocation.

Mission Goal: ${task.mission.title} - ${task.mission.description}
Current Task: ${task.title}
Task Details: ${task.description || ''}
Inputs: ${JSON.stringify(task.input || {})}
${contextFromParents}

Deliver a detailed markdown worksheet outlining:
- Budget allocations (divided by marketing, inventory, operations)
- Product cost sheets (cost price, target sale price, margin percentage)
- Revenue projection models and breakeven point analysis.`;
        break;

      case 'marketing':
        artifactType = 'MARKETING_COPY';
        workerPrompt = `You are a Marketing Copywriter & Campaign Planner. Your job is to generate ad slogans, copy, email campaigns, and flyers.
Create high-conversion messaging.

Mission Goal: ${task.mission.title} - ${task.mission.description}
Current Task: ${task.title}
Task Details: ${task.description || ''}
Inputs: ${JSON.stringify(task.input || {})}
${contextFromParents}

Deliver a creative markdown document containing:
- 3 engaging headlines/slogans for the grand launch
- Facebook and Instagram social media ad copies with hashtags
- Direct email/newsletter outreach template for local subscribers
- Local window banner and print flyer drafts.`;
        break;

      case 'operations':
        artifactType = 'OPERATIONS_PLAN';
        workerPrompt = `You are an Operations & Logistics Agent. Your job is to select suppliers, establish distribution networks, and plan supply chain logistics.
Minimize lead times and setup bottlenecks.

Mission Goal: ${task.mission.title} - ${task.mission.description}
Current Task: ${task.title}
Task Details: ${task.description || ''}
Inputs: ${JSON.stringify(task.input || {})}
${contextFromParents}

Deliver a structured operational checklist detailing:
- Vetted supplier lists (MOQs, lead times, contact info)
- Retail setup, inventory tracking, and warehousing plans
- Delivery and local fulfillment setup strategy.`;
        break;

      default:
        workerPrompt = `You are a specialized Agent. Complete the requested task.
Task Title: ${task.title}
Details: ${task.description || ''}
Inputs: ${JSON.stringify(task.input || {})}
${contextFromParents}`;
    }

    try {
      // 5. Execute LLM completion call
      await db.executionLog.create({
        data: {
          taskId,
          logType: 'prompt',
          message: `Sending prompt to AI Provider... (Length: ${workerPrompt.length} chars)`,
        },
      });

      const response = await ai.generateCompletion({
        messages: [{ role: 'user', content: workerPrompt }],
        temperature: 0.7,
      });

      // 6. Save results, create Artifact records in transaction
      const duration = Date.now() - startTime;

      await db.$transaction(async (tx) => {
        // Create Artifact and version record
        const artifact = await tx.artifact.create({
          data: {
            taskId,
            type: artifactType,
            title: `Deliverable: ${task.title}`,
          },
        });

        await tx.artifactVersion.create({
          data: {
            artifactId: artifact.id,
            version: 1,
            content: response.content,
            metadata: {
              promptTokens: response.usage.promptTokens,
              completionTokens: response.usage.completionTokens,
              totalTokens: response.usage.totalTokens,
              durationMs: duration,
            },
          },
        });

        // Update task status and outputs
        await tx.task.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED',
            output: response.content as any, // Save output string directly or as JSON
            completedAt: new Date(),
          },
        });

        // Update assignment record
        await tx.workerAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'RETURNED',
            duration,
            costTokens: response.usage.totalTokens,
            completedAt: new Date(),
          },
        });

        // Log completion events
        await tx.executionLog.create({
          data: {
            taskId,
            logType: 'response',
            message: `Execution succeeded. Generated Artifact ID: ${artifact.id}`,
          },
        });

        await tx.activity.create({
          data: {
            missionId: task.missionId,
            type: 'TASK_COMPLETED',
            message: `Task "${task.title}" completed successfully in ${duration}ms.`,
          },
        });
      });

      return { success: true, content: response.content };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Handle Task Failure
      await db.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: taskId },
          data: {
            status: 'FAILED',
            output: { error: error.message } as any,
            completedAt: new Date(),
          },
        });

        await tx.workerAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'DESTROYED',
            duration,
            completedAt: new Date(),
          },
        });

        await tx.executionLog.create({
          data: {
            taskId,
            logType: 'stderr',
            message: `Execution failed: ${error.message}`,
          },
        });

        await tx.activity.create({
          data: {
            missionId: task.missionId,
            type: 'TASK_FAILED',
            message: `Task "${task.title}" failed after ${duration}ms. Error: ${error.message}`,
          },
        });
      });

      throw error;
    }
  }
}

export const workerRuntime = new WorkerRuntime();
