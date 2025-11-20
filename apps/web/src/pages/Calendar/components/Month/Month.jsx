import React from 'react';
import Day from '../Day/Day';

export default function Month({ month }) {
  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-5 h-full">
      {month.map((row, i) => (
        <React.Fragment key={i}>
          {row.map((day, idx) => (
            <Day day={day} key={idx} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
