import { api } from '@shared/api/axios';

class EventApiClass {
  // Get all user events with optional filters
  async getAll(params = {}) {
    const response = await api.get('/events', { params });
    return response.data;
  }

  // Get events by calendar ID
  async getByCalendar(calendarId) {
    const response = await api.get(`/calendars/${calendarId}/events`);
    return response.data;
  }

  // Get event by ID
  async getById(eventId) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  }

  // Create new event
  async create(data) {
    const response = await api.post('/events', data);
    return response.data;
  }

  // Update event
  async update(eventId, data) {
    const response = await api.patch(`/events/${eventId}`, data);
    return response.data;
  }

  // Delete event
  async delete(eventId) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  }

  // Add attendee to event
  async addAttendee(eventId, data) {
    const response = await api.post(`/events/${eventId}/attendees`, data);
    return response.data;
  }

  // Update my attendee status
  async updateMyStatus(eventId, status) {
    const response = await api.patch(`/events/${eventId}/attendees/me`, { status });
    return response.data;
  }

  // Remove attendee from event
  async removeAttendee(eventId, attendeeId) {
    const response = await api.delete(`/events/${eventId}/attendees/${attendeeId}`);
    return response.data;
  }
}

export const EventApi = new EventApiClass();
