/**
 * Ponto de diagnóstico ultra-leve (Sem tipos para evitar falhas de build).
 */
export default (req: any, res: any) => {
  res.status(200).json({
    status: "debug_active",
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env: process.env.NODE_ENV,
    url: req.url
  });
};
