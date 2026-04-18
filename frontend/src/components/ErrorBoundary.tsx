import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass p-8 rounded-2xl border border-red-500/20 glow-indigo">
            <h1 className="text-2xl font-black uppercase tracking-widest text-red-500 mb-4">
              Erro de Sincronização
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Ocorreu uma falha inesperada ao carregar a interface premium.
              Nossa equipe técnica foi notificada.
            </p>
            <div className="text-[10px] text-zinc-600 font-mono bg-black/50 p-4 rounded mb-6 overflow-auto max-h-32">
              {typeof this.state.error?.message === 'string' 
                ? this.state.error.message 
                : (this.state.error as any)?.error || JSON.stringify(this.state.error) || "Erro desconhecido"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-indigo hover:bg-brand-indigo/90 text-white font-black uppercase tracking-widest transition-all rounded-lg text-xs"
            >
              Reiniciar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
