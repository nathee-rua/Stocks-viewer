'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function Disclaimer() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="w-full bg-yellow-500/10 border-t border-yellow-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-yellow-200/80">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
        <span>
          ข้อมูลหุ้นเป็นแบบ delayed (~15 นาที) เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน | Stock data is delayed (~15 min) for educational purposes only. Not investment advice.
        </span>
      </div>
      <button onClick={() => setVisible(false)} className="ml-2 hover:text-yellow-100 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
