import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { PasswordReset } from '../models/PasswordReset.js'
import { UserTotp } from '../models/UserTotp.js'

/**
 * Initialize database indexes and collections
 * This replaces mongo-init.js and works with both local MongoDB and Atlas
 */
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database indexes...')

    // Ensure indexes exist for all models
    await User.ensureIndexes()
    await Session.ensureIndexes()
    await PasswordReset.ensureIndexes()
    await UserTotp.ensureIndexes()

    console.log('✅ Database indexes initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database indexes:', error)
    // Don't throw error - indexes might already exist
  }
}

/**
 * Create default admin user if it doesn't exist
 */
export async function createDefaultAdmin() {
  try {
    console.log('👤 Checking for admin user...')

    const adminExists = await User.findOne({ role: 'admin' })
    if (adminExists) {
      console.log('✅ Admin user already exists')
      return
    }

    // Create default admin
    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@chronos.local',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      verified: true,
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
      },
    })

    await adminUser.save()
    console.log('✅ Default admin user created')
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    // Don't throw error - user might already exist
  }
}
