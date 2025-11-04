import express from 'express'
import { User } from '../../models/User.js'

const router = express.Router()

// GET /api/users - Get all users (for testing)
router.get('/', async (_req, res) => {
  try {
    const users = await User.find(
      {},
      { password: 0, twoFactorSecret: 0 },
    ).limit(10)
    res.json({
      success: true,
      data: users,
      count: users.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    })
  }
})

// POST /api/users - Create a new user (for testing)
router.post('/', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message,
      })
    }
  }
})

export { router as UsersRouter }
