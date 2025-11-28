import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#1f2937' : 'white',
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
        },
        classNames: {
          toast: 'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
          title: 'dark:text-gray-100 font-semibold',
          description: 'dark:text-gray-300',
          actionButton: 'dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700 px-3 py-1.5 rounded-md font-medium',
          cancelButton: 'dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 px-3 py-1.5 rounded-md font-medium',
          closeButton: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
