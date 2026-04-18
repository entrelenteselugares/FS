"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
let _supabaseAdmin = null;
/**
 * Lazy initializer para o cliente Supabase Admin.
 * Evita crash no boot caso as variáveis de ambiente estejam ausentes.
 */
function getSupabaseAdmin() {
    if (_supabaseAdmin)
        return _supabaseAdmin;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[CRITICAL] SUPABASE_URL ou SERVICE_ROLE_KEY não configuradas!");
        return null;
    }
    try {
        _supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        return _supabaseAdmin;
    }
    catch (err) {
        console.error("[SUPABASE BOOT ERROR]:", err);
        return null;
    }
}
/**
 * Proxy para interceptar chamadas ao cliente Supabase e validar configuração.
 */
exports.supabaseAdmin = new Proxy({}, {
    get: (target, prop) => {
        const client = getSupabaseAdmin();
        if (!client) {
            throw new Error("SUPABASE_NOT_CONFIGURED: As variáveis SUPABASE_URL ou SERVICE_ROLE_KEY estão ausentes no Vercel.");
        }
        return client[prop];
    }
});
exports.default = exports.supabaseAdmin;
