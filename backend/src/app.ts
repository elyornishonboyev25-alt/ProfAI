import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env, isProduction } from './config/env.js'
import { apiRateLimit } from './middleware/rateLimit.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import testsRoutes from './routes/tests.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import profileRoutes from './routes/profile.routes.js'
import leaderboardRoutes from './routes/leaderboard.routes.js'
import plannerRoutes from './routes/planner.routes.js'
import shadowingRoutes from './routes/shadowing.routes.js'
import podcastsRoutes from './routes/podcasts.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'
import sharedResultsRoutes from './routes/sharedResults.routes.js'
import aiWorkspaceRoutes from './routes/aiWorkspace.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../dist')

export const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: isProduction
      ? env.CORS_ORIGIN
      : (origin, callback) => {
        // Allow any localhost origin or the configured CORS_ORIGIN in development
        if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin === env.CORS_ORIGIN) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(morgan(isProduction ? 'combined' : 'dev'))
app.use(apiRateLimit)

app.use('/api/v1/health', healthRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/tests', testsRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/profile', profileRoutes)
app.use('/api/v1/leaderboard', leaderboardRoutes)
app.use('/api/v1/planner', plannerRoutes)
app.use('/api/v1/shadowing', shadowingRoutes)
app.use('/api/v1/podcasts', podcastsRoutes)
app.use('/api/v1/reviews', reviewsRoutes)
app.use('/api/v1/shared-results', sharedResultsRoutes)
app.use('/api/v1/ai-workspace', aiWorkspaceRoutes)

app.get('/googleea0efe504503609e.html', (_req, res) => {
  res.type('html').send('google-site-verification: googleea0efe504503609e.html')
})

if (isProduction && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

app.use(notFoundHandler)
app.use(errorHandler)
