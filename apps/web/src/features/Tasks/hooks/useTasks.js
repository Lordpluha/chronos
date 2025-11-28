import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TasksApi } from '../api/TasksApi';

// ========== TASK LISTS ==========

export const useTaskLists = () => {
  return useQuery({
    queryKey: ['taskLists'],
    queryFn: () => TasksApi.getTaskLists(),
  });
};

export const useTaskList = (taskListId) => {
  return useQuery({
    queryKey: ['taskList', taskListId],
    queryFn: () => TasksApi.getTaskList(taskListId),
    enabled: !!taskListId,
  });
};

export const useCreateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => TasksApi.createTaskList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] });
    },
  });
};

export const useUpdateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskListId, data }) => TasksApi.updateTaskList(taskListId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] });
      queryClient.invalidateQueries({ queryKey: ['taskList', variables.taskListId] });
    },
  });
};

export const useDeleteTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskListId) => TasksApi.deleteTaskList(taskListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] });
    },
  });
};

// ========== TASKS ==========

export const useTasks = (taskListId, filters = {}) => {
  return useQuery({
    queryKey: ['tasks', taskListId, filters],
    queryFn: () => TasksApi.getTasks(taskListId, filters),
    enabled: !!taskListId,
  });
};

export const useTask = (taskListId, taskId) => {
  return useQuery({
    queryKey: ['task', taskListId, taskId],
    queryFn: () => TasksApi.getTask(taskListId, taskId),
    enabled: !!taskListId && !!taskId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskListId, data }) => TasksApi.createTask(taskListId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskListId] });
      queryClient.invalidateQueries({ queryKey: ['taskList', variables.taskListId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskListId, taskId, data }) => TasksApi.updateTask(taskListId, taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskListId] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskListId, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks'] });
    },
  });
};

export const useToggleTaskCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskListId, taskId }) => TasksApi.toggleTaskCompletion(taskListId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskListId] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskListId, variables.taskId] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskListId, taskId }) => TasksApi.deleteTask(taskListId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskListId] });
      queryClient.invalidateQueries({ queryKey: ['taskList', variables.taskListId] });
    },
  });
};

// ========== STATISTICS ==========

export const useUpcomingTasks = (days = 7) => {
  return useQuery({
    queryKey: ['upcomingTasks', days],
    queryFn: () => TasksApi.getUpcomingTasks(days),
  });
};

export const useTasksWithDates = (options = {}) => {
  return useQuery({
    queryKey: ['tasksWithDates'],
    queryFn: async () => {
      const lists = await TasksApi.getTaskLists();
      const allTasks = [];

      for (const list of lists) {
        const tasks = await TasksApi.getTasks(list._id);
        const tasksWithDates = tasks.filter(task => task.end && !task.completed);
        allTasks.push(...tasksWithDates);
      }

      return allTasks;
    },
    enabled: options.enabled !== false,
  });
};
