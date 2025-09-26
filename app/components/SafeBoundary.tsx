'use client';
import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class SafeBoundary extends React.Component<Props, { hasError: boolean; msg?: string }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, msg: undefined };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: err?.message || String(err) };
  }
  componentDidCatch(err: any) {
    console.error('Client error captured by SafeBoundary:', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10">
          <div className="font-bold mb-1">حدث خطأ في عرض الصفحة</div>
          <div className="text-sm opacity-80">
            تم إيقاف العارض عن السقوط. جرّب تحديث الصفحة أو إعادة اختيار المجموعة / المعرف.
          </div>
          {this.state.msg && (
            <div className="mt-2 text-xs opacity-60 break-words ltr">
              {this.state.msg}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
