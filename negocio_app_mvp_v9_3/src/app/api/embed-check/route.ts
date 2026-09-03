import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (net.isIPv6(ip)) {
    const value = ip.toLowerCase();
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
  }
  return true;
}

async function assertPublicHttpUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Solo se permiten páginas web http o https.");
  if (url.username || url.password) throw new Error("La dirección no es válida.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) throw new Error("Esa dirección no está permitida.");
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => isPrivateIp(item.address))) throw new Error("Esa dirección no está permitida.");
  return url;
}

function frameBlocked(headers: Headers) {
  const xFrame = (headers.get("x-frame-options") || "").trim().toLowerCase();
  if (xFrame === "deny" || xFrame === "sameorigin" || xFrame.startsWith("allow-from")) return true;
  const csp = headers.get("content-security-policy") || "";
  const match = csp.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i);
  if (!match) return false;
  const rule = match[1].trim().toLowerCase();
  if (rule.includes("'none'") || rule.includes("'self'")) return true;
  return !rule.includes("*");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ ok: false, reason: "Escribe una dirección web." }, { status: 400 });

  try {
    let current = await assertPublicHttpUrl(raw);
    for (let redirects = 0; redirects < 5; redirects += 1) {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        headers: { "user-agent": "ControlDeNegocio-EmbedCheck/1.0" },
        signal: AbortSignal.timeout(8000)
      });
      void response.body?.cancel();

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("La página devolvió una redirección inválida.");
        current = await assertPublicHttpUrl(new URL(location, current).toString());
        continue;
      }

      if (frameBlocked(response.headers)) {
        return NextResponse.json({ ok: false, reason: "Esta página no permite abrirse dentro de Control de Negocio." }, { status: 409 });
      }

      if (response.status >= 400) {
        return NextResponse.json({ ok: false, reason: `La página respondió con error ${response.status}.` }, { status: 409 });
      }

      return NextResponse.json({ ok: true, url: current.toString() });
    }
    return NextResponse.json({ ok: false, reason: "La página realizó demasiadas redirecciones." }, { status: 409 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "No se pudo comprobar la página.";
    return NextResponse.json({ ok: false, reason }, { status: 400 });
  }
}
