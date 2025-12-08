import React from 'react';
import Day from '../Day/Day';

export default function Month({ month }) {

  return (
    <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
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
