import { api } from '@shared/api/axios';

export class UserApi {
  /**
   * Update user profile
   * @param {Object} data - Profile data to update
   * @param {string} [data.full_name] - Full name
   * @param {string} [data.email] - Email
   * @param {string} [data.avatar] - Avatar URL
   * @returns {Promise<Object>} Updated user data
   */
  static async updateProfile(data) {
    const response = await api.patch('/users/me', data);
    return response.data.user || response.data;
  }

  /**
   * Change user password
   * @param {Object} data - Password change data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  static async changePassword(data) {
    const response = await api.patch('/users/me', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data.user || response.data;
  }

  /**
   * Upload user avatar
   * @param {File} file - Avatar file
   * @returns {Promise<Object>} Upload response with avatar URL
   */
  static async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user || response.data;
  }

  /**
   * Delete user account
   * @param {string} password - User's password for confirmation
   * @returns {Promise<Object>} Success response
   */
  static async deleteAccount(password) {
    const response = await api.delete('/users/me', {
      data: { password },
    });
    return response.data;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User data
   */
  static async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  }
}
