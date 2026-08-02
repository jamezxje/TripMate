import React from 'react';

export const Table = ({ headers, children, emptyMessage = 'Không có dữ liệu' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};
