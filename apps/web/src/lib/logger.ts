type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class StructuredLogger {
  private format(level: LogLevel, message: string, context?: Record<string, any>) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context ? { context } : {}),
    });
  }

  info(message: string, context?: Record<string, any>) {
    console.log(this.format('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, context?: Record<string, any>) {
    console.error(this.format('error', message, context));
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('debug', message, context));
    }
  }
}

export const logger = new StructuredLogger();
