module.exports = (req, res) => {
  res.status(200).json({
    status: "raw_debug_active",
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env_keys: Object.keys(process.env).filter(k => !k.includes("SECRET") && !k.includes("KEY") && !k.includes("URL"))
  });
};
