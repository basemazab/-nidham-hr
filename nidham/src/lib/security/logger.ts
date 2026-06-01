export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, stack } = entry;
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    if (stack) {
      formatted += `\nStack: ${stack}`;
    }

    return formatted;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): void {
    const entry = this.createEntry(level, message, context, stack);
    this.addToBuffer(entry);

    const formatted = this.formatLogEntry(entry);
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(formatted);
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error?.stack);
  }

  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error?.stack);
  }

  getBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }

  exportLogs(): string {
    return this.logBuffer.map((entry) => this.formatLogEntry(entry)).join("\n\n");
  }
}

export const logger = new Logger();

export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  context?: Record<string, any>
): void {
  logger.info(`API Request: ${method} ${path}`, {
    userId,
    ...context,
  });
}

export function logApiResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  logger.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, {
    userId,
    statusCode,
    duration,
  });
}

export function logAuthEvent(
  event: "login" | "logout" | "token_refresh" | "failed_login",
  userId: string,
  context?: Record<string, any>
): void {
  logger.info(`Auth Event: ${event} for user ${userId}`, context);
}
