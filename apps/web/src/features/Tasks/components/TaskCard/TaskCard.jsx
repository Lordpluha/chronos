import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { Calendar, MoreVertical, Edit, Trash2, AlertCircle, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@shared/ui/dropdown-menu";
import dayjs from 'dayjs';

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TaskCard = ({ task, onToggle, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isOverdue = task.end && !task.completed && dayjs(task.end).isBefore(dayjs());
  const isDueToday = task.end && dayjs(task.end).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  const formatDate = (date) => {
    if (!date) return null;
    const d = dayjs(date);
    if (d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      return `Today`;
    }
    if (d.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')) {
      return `Tomorrow`;
    }
    return d.format('MMM D');
  };

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 mb-2 hover:shadow-md transition-all ${
        task.completed ? 'opacity-60' : ''
      }`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Priority indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${priorityColors[task.priority || 'medium']}`} />

      <div className="flex items-start gap-3 pl-2">
        <Button
          variant={task.completed ? "default" : "outline"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`h-8 shrink-0 ${task.completed ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {task.completed ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Done
            </>
          ) : (
            'Mark Done'
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-base font-medium ${
              task.completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {task.title}
          </h3>

          {task.description && showDetails && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {task.subtasks && task.subtasks.length > 0 && showDetails && (
            <div className="mt-3 space-y-1">
              {task.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className={`h-1.5 w-1.5 rounded-full ${subtask.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className={subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length} completed
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
            {task.end && (
              <div
                className={`flex items-center gap-1 ${
                  isOverdue
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : isDueToday
                    ? 'text-orange-600 dark:text-orange-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.end)}
                {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
