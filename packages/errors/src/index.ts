export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', 500, details);
  }
}

export class AIProviderError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_PROVIDER_ERROR', 502, details);
  }
}

export class TaskExecutionError extends BaseError {
  public readonly taskId: string;

  constructor(taskId: string, message: string, details?: any) {
    super(message, 'TASK_EXECUTION_ERROR', 500, details);
    this.taskId = taskId;
  }
}

export class WorkflowError extends BaseError {
  public readonly missionId: string;

  constructor(missionId: string, message: string, details?: any) {
    super(message, 'WORKFLOW_ERROR', 500, details);
    this.missionId = missionId;
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
  }
}
