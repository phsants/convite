import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Listar festas: exige login; usuário vê só as suas, admin vê todas
router.get('/', requireAuth, async (req, res) => {
  try {
    const order = req.query.order === '-created_date' ? 'DESC' : 'ASC'
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500)
    const adminList = req.query.admin === '1' || req.query.admin === 'true'

    if (req.user.is_admin && adminList) {
      const { rows } = await pool.query(
        `SELECT p.*, u.username as owner_username
         FROM parties p
         LEFT JOIN users u ON p.user_id = u.id
         ORDER BY p.created_date ${order}
         LIMIT $1`,
        [limit]
      )
      return res.json(rows)
    }

    const { rows } = await pool.query(
      `SELECT * FROM parties WHERE user_id = $1 ORDER BY created_date ${order} LIMIT $2`,
      [req.user.id, limit]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Detalhe de uma festa: público (para o link de confirmação)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM parties WHERE id = $1',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const b = req.body
    const { rows } = await pool.query(
      `INSERT INTO parties (user_id, child_name, party_date, party_time, party_location, party_theme, child_age, photos, message, gift_list)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        b.child_name,
        b.party_date,
        b.party_time || null,
        b.party_location || null,
        b.party_theme || null,
        b.child_age ?? null,
        JSON.stringify(b.photos || []),
        b.message || null,
        b.gift_list ?? null,
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

async function canEditParty(req, partyId) {
  const { rows } = await pool.query(
    'SELECT user_id FROM parties WHERE id = $1',
    [partyId]
  )
  if (rows.length === 0) return { ok: false, status: 404 }
  const party = rows[0]
  if (party.user_id !== req.user.id && !req.user.is_admin) {
    return { ok: false, status: 403 }
  }
  return { ok: true }
}

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const allow = await canEditParty(req, req.params.id)
    if (!allow.ok) return res.status(allow.status).json({ error: 'Not found' })

    const b = req.body
    const { rows } = await pool.query(
      `UPDATE parties SET
        child_name = COALESCE($2, child_name),
        party_date = COALESCE($3, party_date),
        party_time = COALESCE($4, party_time),
        party_location = COALESCE($5, party_location),
        party_theme = COALESCE($6, party_theme),
        child_age = COALESCE($7, child_age),
        photos = COALESCE($8::jsonb, photos),
        message = COALESCE($9, message),
        gift_list = COALESCE($10, gift_list)
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        b.child_name,
        b.party_date,
        b.party_time,
        b.party_location,
        b.party_theme,
        b.child_age,
        b.photos != null ? JSON.stringify(b.photos) : null,
        b.message,
        b.gift_list !== undefined ? b.gift_list : null,
      ]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const allow = await canEditParty(req, req.params.id)
    if (!allow.ok) return res.status(allow.status).json({ error: 'Not found' })

    const { rowCount } = await pool.query('DELETE FROM parties WHERE id = $1', [
      req.params.id,
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
