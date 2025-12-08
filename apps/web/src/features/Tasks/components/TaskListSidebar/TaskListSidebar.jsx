import { useState } from 'react';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@shared/ui/dropdown-menu";
import { useTaskLists, useCreateTaskList, useUpdateTaskList, useDeleteTaskList } from '../../hooks';
import { toast } from 'sonner';

export const TaskListSidebar = ({ selectedListId, onSelectList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const { data: taskLists = [], isLoading } = useTaskLists();
  const createMutation = useCreateTaskList();
  const updateMutation = useUpdateTaskList();
  const deleteMutation = useDeleteTaskList();

  const handleCreate = async () => {
    if (!inputValue.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: inputValue.trim(),
        description: '',
      });
      setInputValue('');
      setIsCreating(false);
      toast.success('List created!');
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const handleUpdate = async (listId) => {
    if (!inputValue.trim()) return;

    try {
      await updateMutation.mutateAsync({
        taskListId: listId,
        data: { name: inputValue.trim() },
      });
      setInputValue('');
      setEditingId(null);
      toast.success('List updated!');
    } catch (error) {
      toast.error('Failed to update list');
    }
  };

  const handleDelete = async (listId) => {
    if (!confirm('Delete this list and all its tasks?')) return;

    try {
      await deleteMutation.mutateAsync(listId);
      toast.success('List deleted!');
      if (selectedListId === listId) {
        onSelectList(null);
      }
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  const startEdit = (list) => {
    setEditingId(list._id);
    setInputValue(list.name);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setInputValue('');
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Lists</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setInputValue('');
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {isCreating && (
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') cancelEdit();
              }}
              placeholder="List name"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <Button size="sm" onClick={handleCreate}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
          </div>
        )}

        {taskLists.map((list) => (
          <div key={list._id} className="group">
            {editingId === list._id ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleUpdate(list._id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <Button size="sm" onClick={() => handleUpdate(list._id)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
              </div>
            ) : (
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  selectedListId === list._id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => onSelectList(list._id)}
              >
                <span className="text-sm font-medium truncate">{list.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(list)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(list._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}

        {taskLists.length === 0 && !isCreating && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No lists yet. Create your first list!
          </div>
        )}
      </div>
    </div>
  );
};
