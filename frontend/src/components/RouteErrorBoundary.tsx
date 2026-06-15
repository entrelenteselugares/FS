import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  /** Mude esta key ao navegar entre rotas para forçar o reset do boundary */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * RouteErrorBoundary — envolve painéis individuais.
 * Ao trocar a `resetKey` (geralmente a rota ativa), o boundary se reseta
 * automaticamente, sem recarregar a página toda.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-brand-danger" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-lg font-bold uppercase tracking-widest text-theme-text mb-2">
              Falha no Componente
            </h2>
            <p className="text-sm text-theme-muted leading-relaxed mb-4">
              Este painel encontrou um erro e não pôde ser renderizado. Os outros menus continuam funcionando normalmente.
            </p>
            <pre className="text-[10px] text-brand-danger/70 bg-black/40 border border-white/5 p-3 rounded-lg overflow-auto max-h-24 text-left mb-6">
              {this.state.error?.message ?? "Erro desconhecido"}
            </pre>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-6 py-3 bg-theme-bg-muted hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
