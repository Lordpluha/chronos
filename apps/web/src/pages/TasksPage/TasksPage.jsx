import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Search, X } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { TaskListSidebar, TaskCard, TaskForm } from '@features/Tasks/components';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskCompletion } from '@features/Tasks/hooks';
import { toast } from 'sonner';

export const TasksPage = () => {
  const navigate = useNavigate();
  const [selectedListId, setSelectedListId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const { data: tasks = [], isLoading } = useTasks(selectedListId);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const toggleMutation = useToggleTaskCompletion();

  // Получаем все уникальные теги из задач
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [tasks]);

  // Фильтруем задачи по поиску и тегам
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по выбранным тегам
    if (selectedTags.length > 0) {
      result = result.filter(task =>
        task.tags && selectedTags.every(tag => task.tags.includes(tag))
      );
    }

    return result;
  }, [tasks, searchQuery, selectedTags]);

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreateTask = async (data) => {
    try {
      await createMutation.mutateAsync({
        taskListId: selectedListId,
        data,
      });
      setShowForm(false);
      toast.success('Task created!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (data) => {
    try {
      await updateMutation.mutateAsync({
        taskListId: selectedListId,
        taskId: editingTask._id,
        data,
      });
      setShowForm(false);
      setEditingTask(null);
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleToggle = async (taskId) => {
    try {
      await toggleMutation.mutateAsync({
        taskListId: selectedListId,
        taskId,
      });
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await deleteMutation.mutateAsync({
        taskListId: selectedListId,
        taskId,
      });
      toast.success('Task deleted!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <div className="flex h-screen max-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <TaskListSidebar
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/calendar')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calendar
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            </div>

            {selectedListId && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>

          {selectedListId && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Tags filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tags:</span>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {!selectedListId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No task list selected</p>
                <p className="text-sm">Select a list from the sidebar or create a new one</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">
                  {tasks.length === 0 ? 'No tasks yet' : 'No tasks found'}
                </p>
                <p className="text-sm">
                  {tasks.length === 0
                    ? 'Create your first task to get started'
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {pendingTasks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Pending ({pendingTasks.length})
                  </h2>
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      taskListId={selectedListId}
                      onToggle={() => handleToggle(task._id)}
                      onEdit={() => openEditForm(task)}
                      onDelete={() => handleDelete(task._id)}
                    />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Completed ({completedTasks.length})
                  </h2>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      taskListId={selectedListId}
                      onToggle={() => handleToggle(task._id)}
                      onEdit={() => openEditForm(task)}
                      onDelete={() => handleDelete(task._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={closeForm}
        />
      )}
    </div>
  );
};
