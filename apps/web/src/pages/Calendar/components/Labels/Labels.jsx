import { CalendarContext } from '@shared/context/CalendarContext'
import React, { useContext } from 'react'
import { Checkbox } from '@shared/ui/checkbox'

export const Labels = () => {
  const { labels, updateLabel } = useContext(CalendarContext)

  const labelColorMap = {
    indigo: "bg-indigo-200",
    gray: "bg-gray-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    red: "bg-red-200",
    purple: "bg-purple-200",
  };

  return (
    <>
      <p className='text-gray-500 font-bold mt-10'>Label</p>
      {labels.map(({ label: lbl, checked }, idx) => (
        <label key={idx} className="flex items-center mt-3 cursor-pointer">
          <Checkbox
            checked={checked}
            onCheckedChange={() => updateLabel({ label: lbl, checked: !checked })}
            className="mr-2"
          />
          <span className={`${labelColorMap[lbl] || "bg-blue-500"} w-4 h-4 rounded-full mr-2`}></span>
          <span className="text-gray-700 capitalize">{lbl}</span>
        </label>
      ))}
    </>
  )
}
