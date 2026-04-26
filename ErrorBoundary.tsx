import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-rose-100 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
              <AlertTriangle size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-serif italic text-slate-800 mb-2">عذراً، حدث خطأ تقني</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                واجه رنة مشكلة غير متوقعة. يرجى إعادة تشغيل التطبيق أو المحاولة لاحقاً.
              </p>
            </div>
            
            <div className="w-full p-4 bg-slate-50 rounded-2xl text-left font-mono text-[9px] overflow-x-auto whitespace-pre-wrap text-rose-600/70 border border-slate-100">
              {this.state.error?.message}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-3xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <RotateCcw size={18} />
              <span className="text-sm font-bold">إعادة تشغيل رنة</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
