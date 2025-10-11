import React from 'react';

export default function DebugCSS(){
  return (
    <div className="space-y-4 p-6">
      <div className="p-4 bg-indigo-600 text-white rounded">Primary gradient should show above (Navbar)</div>
      <div className="flex gap-4">
        <div className="p-4 bg-indigo-50 rounded">bg-indigo-50</div>
        <div className="p-4 bg-indigo-100 rounded">bg-indigo-100</div>
        <div className="p-4 bg-white/10 rounded">bg-white/10</div>
      </div>
      <div className="flex gap-4">
        <div className="p-4 shadow rounded">shadow</div>
        <div className="p-4 shadow-md rounded">shadow-md</div>
        <div className="p-4 shadow-sm rounded">shadow-sm</div>
      </div>
    </div>
  )
}
