import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { AppConfig } from './config/index.js'
import { connectMongoose } from './db/database.js'
import { router } from './modules/index.js'
import { initializeDatabase } from './utils/database-init.js'

const app = express()

app.disable('x-powered-by')

app.use(express.static('public'))

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin.startsWith(`http://${AppConfig.FRONT_HOST}:${AppConfig.FRONT_PORT}`) || origin.startsWith(`http://${AppConfig.HOST}:${AppConfig.PORT}`))
      return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// @ts-expect-error
app.use(cookieParser(AppConfig.JWT_SECRET))

// Парсеры тела
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api', (_req, res) => {
  res.send('Welcome to chronos api!')
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    version: '1.0.0',
  })
})

// Routes
app.use('/api', router)

app.use((_req, res) => res.status(404).json({ message: 'Not Found' }))

// Initialize database and start server
async function startServer() {
  try {
    await connectMongoose()

    // Initialize database indexes and admin user
    await initializeDatabase()

    app.listen(AppConfig.PORT, () => {
      console.log(`🚀 Server is running on port ${AppConfig.PORT}`)
      console.log(
        `📊 Health check: http://localhost:${AppConfig.PORT}/api/health`,
      )
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
