import express from 'express'
import { requireAccessToken } from '../../middleware/index.js'
import { validateBody } from '../../utils/index.js'
import { usersService } from './Users.service.js'
import { updateProfileSchema } from './Users.validation.js'

const router = express.Router()

// PATCH /users/me - обновить профиль текущего пользователя
router.patch(
  '/users/me',
  requireAccessToken,
  validateBody(updateProfileSchema),
  async (req, res) => {
    try {
      const updatedUser = await usersService.updateProfile(req.userId, req.body)
      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      })
    } catch (err) {
      console.error('❌ Error updating user profile:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

export { router as UsersRouter }
