// Extensão global do tipo Express Request para incluir o usuário autenticado via JWT.
// Não usar 'import' aqui — o arquivo deve ser um script ambient (sem módulo) para
// que o 'declare global' funcione globalmente em todos os controllers.

declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: string;
      nome: string;
    };
  }
}
