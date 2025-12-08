import { api } from '@shared/api/axios';

class CalendarApiClass {
  // Get all calendars
  async getAll() {
    const response = await api.get('/calendars');
    return response.data;
  }

  // Get calendar by ID
  async getById(calendarId) {
    const response = await api.get(`/calendars/${calendarId}`);
    return response.data;
  }

  // Create new calendar
  async create(data) {
    const response = await api.post('/calendars', data);
    return response.data;
  }

  // Update calendar
  async update(calendarId, data) {
    const response = await api.patch(`/calendars/${calendarId}`, data);
    return response.data;
  }

  // Delete calendar
  async delete(calendarId) {
    const response = await api.delete(`/calendars/${calendarId}`);
    return response.data;
  }

  // Share calendar
  async share(calendarId, data) {
    const response = await api.post(`/calendars/${calendarId}/share`, data);
    return response.data;
  }

  // Remove calendar access
  async removeAccess(calendarId, data) {
    const response = await api.delete(`/calendars/${calendarId}/share`, { data });
    return response.data;
  }

  // Subscribe to calendar via public link (self-subscription)
  async subscribe(calendarId, data = {}) {
    const response = await api.post(`/calendars/${calendarId}/subscribe`, data);
    return response.data;
  }

  // Accept calendar invitation
  async acceptInvitation(calendarId) {
    const response = await api.post(`/calendars/${calendarId}/accept`);
    return response.data;
  }
}

export const CalendarApi = new CalendarApiClass();
