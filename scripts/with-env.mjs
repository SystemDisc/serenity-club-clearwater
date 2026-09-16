import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { parseEnv } from 'node:util'

const [file, command, ...args] = process.argv.slice(2)
if (!file || !command) throw new Error('Usage: node scripts/with-env.mjs ENV_FILE COMMAND [ARGS...]')
// Pass environment values to a fresh process. Passing --env-file directly to
// Next can leak that flag into worker NODE_OPTIONS, where Node rejects it.
const env = { ...process.env, VERCEL: '', ...parseEnv(readFileSync(file, 'utf8')) }
const child = spawn(command, args, { env, stdio: 'inherit', shell: false })
child.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
