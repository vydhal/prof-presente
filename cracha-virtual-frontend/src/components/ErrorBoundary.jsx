import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Atualiza o state para que a próxima renderização mostre a UI alternativa.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Você também pode registrar o erro em um serviço de relatório de erros
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        // Limpar cookies se houver (mas já removemos a lib de cookies)
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            // Você pode renderizar qualquer UI alternativa
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado!</h1>
                        <p className="text-gray-600 mb-6 text-sm">
                            Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
                        </p>

                        <div className="bg-gray-100 p-4 rounded text-left overflow-auto max-h-40 mb-6 text-xs font-mono text-red-800">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>

                        <div className="space-y-3">
                            <Button onClick={this.handleReload} className="w-full">
                                Recarregar Página
                            </Button>
                            <Button variant="outline" onClick={this.handleClearCache} className="w-full text-red-600 border-red-200 hover:bg-red-50">
                                Limpar Cache e Sair
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
