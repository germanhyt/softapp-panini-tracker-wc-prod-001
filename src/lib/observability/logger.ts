type LogLevel = 'info' | 'warn' | 'error'

type LogPayload = {
  level: LogLevel
  context: string
  message: string
  timestamp: string
  meta?: Record<string, unknown>
  stack?: string
}

function writeLog(payload: LogPayload): void {
  const line = JSON.stringify(payload)
  if (payload.level === 'error') {
    console.error(line)
    return
  }
  if (payload.level === 'warn') {
    console.warn(line)
    return
  }
  console.log(line)
}

export function logInfo(context: string, message: string, meta?: Record<string, unknown>): void {
  writeLog({
    level: 'info',
    context,
    message,
    timestamp: new Date().toISOString(),
    meta,
  })
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>): void {
  writeLog({
    level: 'warn',
    context,
    message,
    timestamp: new Date().toISOString(),
    meta,
  })
}

export function logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
  writeLog({
    level: 'error',
    context,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
    meta,
  })
}
