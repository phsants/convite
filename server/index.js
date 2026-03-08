import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initDb } from './db.js'
import { optionalAuth } from './middleware/auth.js'
import partiesRouter from './routes/parties.js'
import guestsRouter from './routes/guests.js'
import uploadRouter from './routes/upload.js'
import authRouter from './routes/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api', optionalAuth)
app.use('/api/parties', partiesRouter)
app.use('/api/guests', guestsRouter)
app.use('/api/upload', uploadRouter)
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Health check for EasyPanel/Docker
app.get('/health', (req, res) => res.json({ ok: true }))

// In production, serve frontend static files (set by Dockerfile)
const distPath = process.env.DIST_PATH || join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next()
  res.sendFile(join(distPath, 'index.html'))
})

async function start() {
  try {
    await initDb()
    console.log('Database initialized')
  } catch (err) {
    console.error('DB init failed:', err.message)
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
