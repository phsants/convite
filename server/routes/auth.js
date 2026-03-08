import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' })
    }
    const { rows } = await pool.query(
      'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1',
      [username.trim()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' })
    }
    const user = rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' })
    }
    const token = signToken({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    })
    res.json({
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
      },
      token,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
