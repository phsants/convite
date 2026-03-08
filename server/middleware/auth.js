import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'convite-secret-mude-em-producao'

/**
 * Lê o token do header Authorization e define req.user se for válido.
 * Não bloqueia se não houver token (req.user = null).
 */
export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    req.user = null
    return next()
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = {
      id: payload.id,
      username: payload.username,
      is_admin: payload.is_admin === true,
    }
  } catch {
    req.user = null
  }
  next()
}

/**
 * Retorna 401 se req.user não estiver definido (usuário não autenticado).
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado. Faça login.' })
  }
  next()
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
