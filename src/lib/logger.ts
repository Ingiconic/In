/**
 * Structured logging utility with production awareness
 * Automatically disables debug/info logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    // In production, only log warnings and errors
    if (!isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, data || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, data || '');
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, message, data || '');
        break;
      case 'debug':
        console.log(`[${timestamp}] DEBUG:`, message, data || '');
        break;
    }

    return logEntry;
  }

  debug(message: string, data?: any) {
    return this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    return this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    return this.log('warn', message, data);
  }

  error(message: string, error?: unknown) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    return this.log('error', message, errorData);
  }
}

export const logger = new Logger();
