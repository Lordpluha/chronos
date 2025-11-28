import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { AppConfig } from '../config/index.js'

let db = null
let client = null
let isConnected = false

// MongoDB native driver connection
export async function connectMongoDB() {
  try {
    if (client?.topology?.isConnected()) {
      return db
    }

    client = new MongoClient(AppConfig.MONGO_URI, AppConfig.MONGO_OPTIONS)

    await client.connect()
    db = client.db(AppConfig.DB_NAME)


    return db
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error)
    throw error
  }
}

// Mongoose connection optimized for serverless
export async function connectMongoose() {
  try {
    // Reuse existing connection if available
    if (isConnected && mongoose.connection.readyState === 1) {

      return mongoose.connection
    }

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }

    await mongoose.connect(AppConfig.MONGO_URI, {
      ...AppConfig.MONGO_OPTIONS,
      // Serverless specific optimizations
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
      authSource: 'admin',
    })

    isConnected = true


    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {

      isConnected = false
    })

    mongoose.connection.on('reconnected', () => {

      isConnected = true
    })

    return mongoose.connection
  } catch (error) {
    console.error('❌ Mongoose Atlas connection error:', error)
    isConnected = false
    throw error
  }
}

// Get database instance
export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectMongoDB() first.')
  }
  return db
}

// Close connections gracefully (important for serverless)
export async function closeDatabaseConnections() {
  try {
    if (client) {
      await client.close()

    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      isConnected = false

    }
  } catch (error) {
    console.error('❌ Error closing database connections:', error)
  }
}

// Serverless-friendly connection helper
export async function ensureConnection() {
  if (!isConnected || mongoose.connection.readyState !== 1) {

    await connectMongoose()
  }
  return mongoose.connection
}

// Graceful shutdown (less critical for serverless but good practice)
if (AppConfig.env !== 'production') {
  process.on('SIGINT', async () => {
    await closeDatabaseConnections()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await closeDatabaseConnections()
    process.exit(0)
  })
}
