import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const shell = process.platform === 'win32'

const children = [
  spawn('yarn', ['dev'], { cwd: root, stdio: 'inherit', shell }),
  spawn('yarn', ['dev:ws'], { cwd: root, stdio: 'inherit', shell }),
]

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
