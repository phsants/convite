/**
 * Cria um usuário no banco.
 *
 * Modo fácil (perguntas interativas):
 *   cd server
 *   node scripts/create-user.js
 *
 * Modo direto:
 *   node scripts/create-user.js admin senha123 true
 *   node scripts/create-user.js maria senha456 false
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import readline from 'readline'
import pg from 'pg'
import bcrypt from 'bcrypt'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(pergunta) {
  return new Promise((resolve) => rl.question(pergunta, resolve))
}

async function main() {
  let username = process.argv[2]
  let password = process.argv[3]
  let isAdminArg = process.argv[4]

  if (!username || !password) {
    console.log('')
    console.log('  Criar usuário (deixe em branco = admin)')
    console.log('')
    if (!username) username = (await ask('  Usuário: ')).trim()
    if (!password) password = await ask('  Senha: ')
    if (!username || !password) {
      console.error('  Usuário e senha são obrigatórios.')
      rl.close()
      process.exit(1)
    }
    const adminResp = (await ask('  É admin? (s/n) [n]: ')).trim().toLowerCase()
    isAdminArg = adminResp === 's' || adminResp === 'sim' || adminResp === '1' ? 'true' : 'false'
    rl.close()
  }

  const isAdmin = isAdminArg === 'true' || isAdminArg === '1'

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const passwordHash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, is_admin)
     VALUES ($1, $2, $3)
     RETURNING id, username, is_admin, created_at`,
    [username, passwordHash, isAdmin]
  )
  console.log('')
  console.log('  Usuário criado:', rows[0].username, isAdmin ? '(admin)' : '')
  console.log('')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
