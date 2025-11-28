import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TasksApi = {
  // ========== TASK LISTS ==========

  async getTaskLists() {
    const response = await api.get('/task-lists');
    return response.data.data;
  },

  async getTaskList(taskListId) {
    const response = await api.get(`/task-lists/${taskListId}`);
    return response.data.data;
  },

  async createTaskList(data) {
    const response = await api.post('/task-lists', data);
    return response.data.data;
  },

  async updateTaskList(taskListId, data) {
    const response = await api.patch(`/task-lists/${taskListId}`, data);
    return response.data.data;
  },

  async deleteTaskList(taskListId) {
    const response = await api.delete(`/task-lists/${taskListId}`);
    return response.data;
  },

  // ========== TASKS ==========

  async getTasks(taskListId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.filter) params.append('filter', filters.filter);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/tasks/${taskListId}?${params.toString()}`);
    return response.data.data;
  },

  async getTask(taskListId, taskId) {
    const response = await api.get(`/tasks/${taskListId}/${taskId}`);
    return response.data.data;
  },

  async createTask(taskListId, data) {
    const response = await api.post(`/tasks/${taskListId}`, data);
    return response.data.data;
  },

  async updateTask(taskListId, taskId, data) {
    const response = await api.patch(`/tasks/${taskListId}/${taskId}`, data);
    return response.data.data;
  },

  async toggleTaskCompletion(taskListId, taskId) {
    const response = await api.patch(`/tasks/${taskListId}/${taskId}/toggle`);
    return response.data.data;
  },

  async deleteTask(taskListId, taskId) {
    const response = await api.delete(`/tasks/${taskListId}/${taskId}`);
    return response.data;
  },

  async addTag(taskListId, taskId, tag) {
    const response = await api.post(`/tasks/${taskListId}/${taskId}/tags`, { tag });
    return response.data.data;
  },

  async removeTag(taskListId, taskId, tag) {
    const response = await api.delete(`/tasks/${taskListId}/${taskId}/tags`, { data: { tag } });
    return response.data.data;
  },

  // ========== STATISTICS ==========

  async getOverdueTasks() {
    const response = await api.get('/tasks/overdue');
    return response.data.data;
  },

  async getTodayTasks() {
    const response = await api.get('/tasks/today');
    return response.data.data;
  },

  async getUpcomingTasks(days = 7) {
    const response = await api.get(`/tasks/upcoming?days=${days}`);
    return response.data.data;
  },
};
