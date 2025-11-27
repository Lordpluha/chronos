import { api } from '@shared/api/axios'

class RemindersApiClass {
  async createReminder(calendarId, data) {
    const { calendar, ...rest } = data;
    const response = await api.post('/reminders', { ...rest, calendar_id: calendarId });
    return response.data;
  }

  async getCalendarReminders(calendarId, params = {}) {
    const response = await api.get(`/calendars/${calendarId}/reminders`, { params });
    return response.data;
  }

  async getUserReminders(params = {}) {
    const response = await api.get('/reminders', { params });
    return response.data;
  }

  async getReminder(reminderId) {
    const response = await api.get(`/reminders/${reminderId}`);
    return response.data;
  }

  async updateReminder(reminderId, data) {
    const response = await api.patch(`/reminders/${reminderId}`, data);
    return response.data;
  }

  async deleteReminder(reminderId) {
    const response = await api.delete(`/reminders/${reminderId}`);
    return response.data;
  }

  async shareReminder(reminderId, userId, permission = 'read') {
    const response = await api.post(`/reminders/${reminderId}/share`, { userId, permission });
    return response.data;
  }

  async removeSharedAccess(reminderId, userId) {
    const response = await api.delete(`/reminders/${reminderId}/share/${userId}`);
    return response.data;
  }
}

export const RemindersApi = new RemindersApiClass();
