import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

interface LoggerOptions {
  service: string;
  level?: LogLevel;
  logDir?: string;
}

/**
 * Create a Winston logger instance for structured logging
 */
export function createLogger(options: LoggerOptions): winston.Logger {
  const {
    service,
    level = (process.env.LOG_LEVEL as LogLevel) || 'info',
    logDir = process.env.LOG_DIR || 'logs',
  } = options;

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Custom format for console output (development)
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
    })
  );

  // JSON format for file output (production)
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : fileFormat,
      level: isDevelopment ? 'debug' : level,
    })
  );

  // File transports (production only)
  if (!isDevelopment) {
    // Error logs (separate file)
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, `${service}-error-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })
    );

    // Combined logs (all levels)
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, `${service}-combined-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: { service },
    transports,
    exitOnError: false,
  });
}

/**
 * Logger wrapper with common methods
 */
export class Logger {
  private logger: winston.Logger;

  constructor(options: LoggerOptions) {
    this.logger = createLogger(options);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }

  http(message: string, meta?: Record<string, any>): void {
    this.logger.http(message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    this.logger.log(level, message, meta);
  }

  /**
   * Create a child logger with additional default metadata
   */
  child(meta: Record<string, any>): Logger {
    const childLogger = new Logger({ service: this.logger.defaultMeta?.service || 'unknown' });
    childLogger.logger = this.logger.child(meta);
    return childLogger;
  }
}

// Export convenience function for quick logger creation
export function getLogger(service: string, level?: LogLevel): Logger {
  return new Logger({ service, level });
}
