import express from 'express'
import { requireAccessToken } from '../../middleware/index.js'
import { validateBody } from '../../utils/index.js'
import { usersService } from './Users.service.js'
import { updateProfileSchema } from './Users.validation.js'
import { uploadAvatar } from '../../middleware/upload.js'

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

// POST /users/me/avatar - загрузить аватар
router.post(
  '/users/me/avatar',
  requireAccessToken,
  uploadAvatar.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      // Формируем полный URL для аватара
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.BACK_HOST}`
        : `http://${process.env.BACK_HOST}:${process.env.BACK_PORT}`
      const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`

      const updatedUser = await usersService.updateAvatar(req.userId, avatarUrl)

      return res.json({
        message: 'Avatar uploaded successfully',
        user: updatedUser,
      })
    } catch (err) {
      console.error('❌ Error uploading avatar:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /users/me - удалить аккаунт текущего пользователя
router.delete('/users/me', requireAccessToken, async (req, res) => {
  try {
    const { password } = req.body
    await usersService.deleteAccount(req.userId, password)
    return res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error('❌ Error deleting user account:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

export { router as UsersRouter }
