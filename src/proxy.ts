import { NextRequest, NextResponse } from "next/server";
import { verificarToken, COOKIE_NAME } from "@/lib/jwt";

const ROTAS_PROTEGIDAS: Record<string, string[]> = {
  "/admin":       ["ADMIN"],
  "/editor":      ["ADMIN", "EDITOR"],
  "/operador":    ["ADMIN", "OPERADOR"],
  "/titular":     ["ADMIN", "TITULAR"],
  "/minha-conta": ["ADMIN", "CLIENTE", "TITULAR", "EDITOR", "OPERADOR"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const rotaProtegida = Object.keys(ROTAS_PROTEGIDAS).find((r) =>
    pathname.startsWith(r)
  );

  if (!rotaProtegida) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verificarToken(token);
  if (!payload) {
    const url = new URL("/login", request.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (!ROTAS_PROTEGIDAS[rotaProtegida].includes(payload.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-usuario-id", payload.usuarioId);
  requestHeaders.set("x-usuario-role", payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/editor/:path*",
    "/operador/:path*",
    "/titular/:path*",
    "/minha-conta/:path*",
  ],
};
