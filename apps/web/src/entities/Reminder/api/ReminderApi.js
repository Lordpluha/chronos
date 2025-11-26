import { api } from '@shared/api/axios';

class ReminderApiClass {
  // Get all user reminders
  async getAll() {
    const response = await api.get('/reminders');
    return response.data;
  }

  // Get reminders by calendar ID
  async getByCalendar(calendarId) {
    const response = await api.get(`/calendars/${calendarId}/reminders`);
    return response.data;
  }

  // Get reminder by ID
  async getById(reminderId) {
    const response = await api.get(`/reminders/${reminderId}`);
    return response.data;
  }

  // Create new reminder
  async create(data) {
    const response = await api.post('/reminders', data);
    return response.data;
  }

  // Update reminder
  async update(reminderId, data) {
    const response = await api.patch(`/reminders/${reminderId}`, data);
    return response.data;
  }

  // Delete reminder
  async delete(reminderId) {
    const response = await api.delete(`/reminders/${reminderId}`);
    return response.data;
  }
}

export const ReminderApi = new ReminderApiClass();
