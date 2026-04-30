import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";

interface DiagResults {
  timestamp: string;
  env: {
    NODE_ENV?: string;
    VERCEL: boolean;
    HAS_DB: boolean;
    HAS_SUPABASE: boolean;
    HAS_JWT_SECRET: boolean;
  };
  database: { status: string; count?: number; message?: string; code?: string };
  supabase: { status: string; found?: number; message?: string };
}

export async function diagnostics(req: Request, res: Response) {
  const results: DiagResults = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      HAS_DB: !!process.env.DATABASE_URL,
      HAS_SUPABASE: !!process.env.SUPABASE_URL,
      HAS_JWT_SECRET: !!process.env.JWT_SECRET
    },
    database: { status: "pending" },
    supabase: { status: "pending" }
  };

  try {
    // 1. Teste de Banco (Prisma)
    const userCount = await prisma.user.count();
    results.database = { status: "ok", count: userCount };
  } catch (err: unknown) {
    results.database = { 
      status: "error", 
      message: err instanceof Error ? err.message : String(err),
      code: (err as { code?: string })?.code 
    };
  }

  try {
    // 2. Teste de Supabase (Lista usuários - requer service role)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
    results.supabase = { status: "ok", found: data?.users?.length || 0 };
  } catch (err: unknown) {
    results.supabase = { 
      status: "error", 
      message: err instanceof Error ? err.message : String(err) 
    };
  }

  return res.json(results);
}
