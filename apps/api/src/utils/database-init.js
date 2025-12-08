import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { Calendar } from '../models/Calendar.js'
import { Reminder } from '../models/Reminder.js'
import { Event } from '../models/Event.js'
import { Task } from '../models/Task.js'
import { TaskList } from '../models/TaskList.js'
import { PasswordResetOtp } from '../models/PasswordResetOtp.js'
import { RegistrationTotp } from '../models/RegistrationTotp.js'

/**
 * Initialize database indexes and collections
 * This replaces mongo-init.js and works with both local MongoDB and Atlas
 */
export async function initializeDatabase() {
  try {


    // Ensure indexes exist for all models
    await Calendar.ensureIndexes()
    await Event.ensureIndexes()
    await PasswordResetOtp.ensureIndexes()
    await RegistrationTotp.ensureIndexes()
    await Reminder.ensureIndexes()

    // Handle Session indexes separately to catch index conflicts
    try {
      await Session.ensureIndexes()
    } catch (sessionError) {
      // Code 85 = IndexOptionsConflict, Code 86 = IndexKeySpecsConflict
      // Ignore these errors - indexes already exist
      if (sessionError.code !== 85 && sessionError.code !== 86) {
        throw sessionError
      }

    }

    await Task.ensureIndexes()
    await TaskList.ensureIndexes()
    await User.ensureIndexes()


  } catch (error) {
    console.error('❌ Error initializing database indexes:', error)
    // Don't throw error - indexes might already exist
  }
}
