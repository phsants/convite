import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

async function canAccessParty(req, partyId) {
  const { rows } = await pool.query(
    'SELECT user_id FROM parties WHERE id = $1',
    [partyId]
  )
  if (rows.length === 0) return false
  const party = rows[0]
  if (!req.user) return false
  if (party.user_id === req.user.id || req.user.is_admin) return true
  return false
}

// Listar por confirmation_token: público (link de confirmação)
router.get('/', async (req, res) => {
  try {
    const { party_id, confirmation_token, order, limit } = req.query

    if (confirmation_token) {
      const { rows } = await pool.query(
        'SELECT * FROM guests WHERE confirmation_token = $1 ORDER BY created_date ASC',
        [confirmation_token]
      )
      return res.json(rows)
    }

    if (!party_id) {
      return res.status(400).json({ error: 'party_id or confirmation_token required' })
    }

    const allowed = req.user && (await canAccessParty(req, party_id))
    if (!allowed) {
      return res.status(401).json({ error: 'Não autorizado. Faça login.' })
    }

    const orderDir = order === '-created_date' ? 'DESC' : 'ASC'
    const limitNum = Math.min(parseInt(limit, 10) || 500, 1000)
    const { rows } = await pool.query(
      `SELECT * FROM guests WHERE party_id = $1 ORDER BY created_date ${orderDir} LIMIT $2`,
      [party_id, limitNum]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/guests/confirm - público (link de confirmação; sem login)
router.post('/confirm', async (req, res) => {
  try {
    const { confirmation_token, updates } = req.body
    if (!confirmation_token || !updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'confirmation_token e updates são obrigatórios' })
    }
    const guestIds = Object.keys(updates)
    if (guestIds.length === 0) {
      return res.status(400).json({ error: 'Nenhuma atualização enviada' })
    }
    const { rows: guestsWithToken } = await pool.query(
      'SELECT id FROM guests WHERE confirmation_token = $1',
      [confirmation_token]
    )
    const validIds = new Set(guestsWithToken.map((g) => g.id))
    const invalid = guestIds.filter((id) => !validIds.has(id))
    if (invalid.length > 0) {
      return res.status(400).json({ error: 'Alguns convidados não pertencem a este link' })
    }
    const responseDate = new Date().toISOString()
    for (const guestId of guestIds) {
      const data = updates[guestId] || {}
      await pool.query(
        `UPDATE guests SET
          confirmed_status = COALESCE($2, confirmed_status),
          age = COALESCE($3, age),
          message = COALESCE($4, message),
          response_date = $5
         WHERE id = $1`,
        [
          guestId,
          data.status ?? data.confirmed_status ?? null,
          data.age != null ? data.age : null,
          data.message ?? null,
          responseDate,
        ]
      )
    }
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/guests/:id - exige auth e permissão na festa do convidado
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM guests WHERE id = $1',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const allowed = await canAccessParty(req, rows[0].party_id)
    if (!allowed) return res.status(403).json({ error: 'Não autorizado' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { party_id, ...rest } = req.body
    if (!party_id) return res.status(400).json({ error: 'party_id required' })
    const allowed = await canAccessParty(req, party_id)
    if (!allowed) return res.status(403).json({ error: 'Não autorizado' })

    const {
      name,
      type,
      age,
      group_name,
      confirmation_token,
      confirmed_status,
      message,
    } = req.body
    const { rows } = await pool.query(
      `INSERT INTO guests (name, type, age, group_name, party_id, confirmation_token, confirmed_status, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        type || 'adult',
        age ?? null,
        group_name || null,
        party_id,
        confirmation_token,
        confirmed_status || 'pending',
        message || null,
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const records = req.body
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array' })
    }
    const partyId = records[0]?.party_id
    if (!partyId) return res.status(400).json({ error: 'party_id required in records' })
    const allowed = await canAccessParty(req, partyId)
    if (!allowed) return res.status(403).json({ error: 'Não autorizado' })

    const created = []
    for (const r of records) {
      const {
        name,
        type,
        age,
        group_name,
        party_id,
        confirmation_token,
        confirmed_status,
      } = r
      const { rows } = await pool.query(
        `INSERT INTO guests (name, type, age, group_name, party_id, confirmation_token, confirmed_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          name,
          type || 'adult',
          age ?? null,
          group_name || null,
          party_id,
          confirmation_token,
          confirmed_status || 'pending',
        ]
      )
      created.push(rows[0])
    }
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: guestRows } = await pool.query(
      'SELECT party_id FROM guests WHERE id = $1',
      [req.params.id]
    )
    if (guestRows.length === 0) return res.status(404).json({ error: 'Not found' })
    const allowed = await canAccessParty(req, guestRows[0].party_id)
    if (!allowed) return res.status(403).json({ error: 'Não autorizado' })

    const {
      name,
      type,
      age,
      group_name,
      confirmation_token,
      confirmed_status,
      response_date,
      message,
    } = req.body
    const { rows } = await pool.query(
      `UPDATE guests SET
        name = COALESCE($2, name),
        type = COALESCE($3, type),
        age = COALESCE($4, age),
        group_name = COALESCE($5, group_name),
        confirmation_token = COALESCE($6, confirmation_token),
        confirmed_status = COALESCE($7, confirmed_status),
        response_date = COALESCE($8, response_date),
        message = COALESCE($9, message)
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        name,
        type,
        age,
        group_name,
        confirmation_token,
        confirmed_status,
        response_date,
        message,
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
    const { rows: guestRows } = await pool.query(
      'SELECT party_id FROM guests WHERE id = $1',
      [req.params.id]
    )
    if (guestRows.length === 0) return res.status(404).json({ error: 'Not found' })
    const allowed = await canAccessParty(req, guestRows[0].party_id)
    if (!allowed) return res.status(403).json({ error: 'Não autorizado' })

    const { rowCount } = await pool.query('DELETE FROM guests WHERE id = $1', [
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
