import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getGzipBomb } from "@/lib/gzipBomb";
import {
  globalEdgeLimiter,
  adminLoginEdgeLimiter,
  apiEdgeLimiter,
} from "@/lib/rateLimit";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

// Список User-Agent популярных сканеров и фаззеров
const SCANNER_UA_REGEX =
  /(sqlmap|nikto|dirbuster|dirsearch|gobuster|ffuf|wfuzz|wpscan|nuclei|acunetix|nessus|nmap|masscan|zgrab|openvas|arachni|netsparker|burpcollaborator|hydra|medusa|havij)/i;

// Характерные пути сканирования уязвимостей
const SUSPICIOUS_PATHS_REGEX =
  /(\.(php\d*|asp|aspx|jsp|jspx|cgi|cfm|pl|sh|bash|action|do|phtml|bak|backup|old|orig|tar|gz|tgz|bz2|7z|rar|zip)$)|(\/(wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|wordpress|phpmyadmin|pma|adminer|myadmin|swagger|api-docs|v2\/api-docs|telescope|solr|autodiscover|cgi-bin|boaform|HNAP1|shell|invoker|jmx-console|manager\/html|\.aws|\.docker|\.ssh))/i;

// Паттерны LFI / Path Traversal
const TRAVERSAL_REGEX = /(\.\.\/|\.\.\\|%2e%2e|\/etc\/passwd|\/win\.ini|\/boot\.ini)/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const clientIp = getClientIp(request);

  // ══════════════════════════════════════════════════════════════
  // RATE LIMITING (EDGE GUARD)
  // ══════════════════════════════════════════════════════════════
  const hasAdminCookie = Boolean(request.cookies.get("oss_admin_sess_v3")?.value);

  // Авторизованный админ никогда не рейтлимитится на платформе
  if (!hasAdminCookie) {
    if (
      pathname.startsWith("/api") &&
      !pathname.startsWith("/api/badge") &&
      pathname !== "/api/backdoor" &&
      pathname !== "/api/debug"
    ) {
      const res = apiEdgeLimiter.check(clientIp);
      if (!res.success) {
        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Превышен лимит запросов к API.",
            retryAfter: res.retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Retry-After": String(res.retryAfter || 60),
              "X-RateLimit-Limit": "25",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(res.resetAt),
            },
          }
        );
      }
    } else if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/.well-known") &&
      !pathname.startsWith("/flag.txt") &&
      !pathname.startsWith("/robots.txt")
    ) {
      const res = globalEdgeLimiter.check(clientIp);
      if (!res.success) {
        return new NextResponse(
          `[429] Too Many Requests. Превышен лимит запросов. Подождите ${res.retryAfter} сек.\n`,
          {
            status: 429,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Retry-After": String(res.retryAfter || 60),
              "X-RateLimit-Limit": "80",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(res.resetAt),
            },
          }
        );
      }
    }
  }


  // ══════════════════════════════════════════════════════════════
  // КОЛЛЕКЦИЯ ПАСХАЛОК ДЛЯ ХАКЕРОВ, ПЕНТЕСТЕРОВ И ЛЮБОПЫТНЫХ (CTF)
  // ══════════════════════════════════════════════════════════════

  // 1. Поиск /.env
  if (pathname === "/.env" || pathname.startsWith("/.env.")) {
    const fakeEnv = `FLAG{TI_CHTO_EBANUTIY_KTO_V_PROD_ENV_ZALIVAET}
# Думал здесь лежат боевые токены?
# Напиши @lonestill в Telegram, если хочешь обсудить баунти.
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=root
DB_PASSWORD=admin
SECRET_KEY=lonestill_top_pentester_lovetz
APP_DEBUG=false
TURSO_AUTH_TOKEN=fake_turso_token_try_harder_anon
`;
    return new NextResponse(fakeEnv, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Easter-Egg": "Fake-Env-Trap",
      },
    });
  }

  // 2. Ловушка из robots.txt -> /secret-keys
  if (pathname === "/secret-keys" || pathname === "/keys") {
    return NextResponse.json(
      {
        warning: "CRITICAL_KEY_LEAK",
        flag: "FLAG{ROBOTS_TXT_REVERSE_ENGINEER_GIGACHAD}",
        status: "leaked",
        api_key: "sk-lonestill-fake-key-dont-waste-time-writing-scripts",
        telegram: "https://t.me/lonestill",
        note: "Респект за внимательность к robots.txt. Напиши @lonestill, если хочешь поговорить за безопасность.",
      },
      {
        headers: { "X-Easter-Egg": "Robots-Txt-Lover" },
      }
    );
  }

  // 3. Ловушка из комментария в исходнике HTML -> /api/backdoor
  if (pathname === "/api/backdoor") {
    return NextResponse.json(
      {
        status: "busted",
        flag: "FLAG{HTML_SOURCE_CODE_INSPECTOR_TOP_1}",
        comment: "Ты реально полез проверять коммент в HTML-исходнике? За любопытство 10/10.",
        contact: "https://t.me/lonestill",
      },
      {
        headers: { "X-Easter-Egg": "Source-Code-Inspector" },
      }
    );
  }

  // 4. Поиск утечки Git: /.git/HEAD, /.git/config
  if (pathname.startsWith("/.git")) {
    const fakeGit = `ref: refs/heads/lonestill-super-secret-branch
# FLAG{GIT_EXPOSED_OR_MAYBE_NOT_LONESTILL}
# Думал стянешь репозиторий через git-dumper?
# Здесь Vercel Edge, файловой системы git тут нет в помине. Пиши @lonestill в TG.
`;
    return new NextResponse(fakeGit, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Easter-Egg": "Fake-Git-Repo",
      },
    });
  }

  // 5. Поиск дампа БД: /backup.sql, /dump.sql, /db.sql
  if (pathname.endsWith(".sql") || pathname === "/backup" || pathname === "/dump") {
    const fakeSql = `-- PostgreSQL Database Dump
-- Dumped by pg_dump version 16.2
-- Host: localhost    Database: oss_hub_production

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

INSERT INTO users (username, password_hash) VALUES 
('lonestill', '$2b$12$FLAG_SQL_DUMP_IS_A_TRAP_PING_LONESTILL_TG_1337');

-- Думал найти боевой дамп? Красава, но тут Turso через LibSQL.
-- Если есть реальный вектор инъекции — пиши @lonestill.
`;
    return new NextResponse(fakeSql, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Easter-Egg": "Fake-SQL-Dump",
      },
    });
  }

  // 6. Поиск истории команд: /.bash_history, /.zsh_history, /.history
  if (pathname.includes("history")) {
    const fakeHistory = `git commit -m "fix: temporary hardcode admin token"
curl -X POST https://api.telegram.org/botLONESTILL/sendMessage -d "Pentesters are scanning"
echo "FLAG{BASH_HISTORY_SNOOPER_CAUGHT_RED_HANDED}"
rm -rf /var/log/nginx/*
history -c
`;
    return new NextResponse(fakeHistory, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Easter-Egg": "Fake-Bash-History",
      },
    });
  }

  // 7. Поиск Spring Boot Actuator / метрик: /actuator, /actuator/health, /metrics
  if (pathname.startsWith("/actuator") || pathname === "/metrics") {
    return NextResponse.json(
      {
        status: "UP",
        components: {
          database: { status: "UP", details: { database: "Turso LibSQL Serverless" } },
          security: { status: "PARANOID", details: { lead: "@lonestill" } },
          memory: { status: "OVERFLOWING_FOR_SCANNERS" },
        },
        flag: "FLAG{SPRING_BOOT_ACTUATOR_IN_NEXTJS_LMAO}",
        author: "https://t.me/lonestill",
      },
      {
        headers: { "X-Easter-Egg": "Fake-Actuator" },
      }
    );
  }

  // 8. Поиск debug эндпоинтов: /api/v1/debug, /debug
  if (pathname === "/debug" || pathname === "/api/v1/debug" || pathname === "/api/debug") {
    return NextResponse.json(
      {
        debug: true,
        node_env: "production",
        target: "OSS Hub Platform",
        architect: "lonestill",
        flag: "FLAG{DEBUG_ENDPOINT_HUNTER_ELITE}",
        message: "Эндпоинт отладки найден, но тут чисто стеб. Реальный репорт шли в Telegram: @lonestill",
      },
      {
        headers: { "X-Easter-Egg": "Fake-Debug-API" },
      }
    );
  }

  // 9. Apache / Nginx статус: /server-status
  if (pathname === "/server-status") {
    const fakeStatus = `Apache Server Status for oss-hub.internal (via Vercel Edge)
Current Time: Friday, 09-Oct-2026 22:30:00 MSK
Restart Time: Never (Serverless Edge)
Server uptime: 999 days
Total accesses: 1337 - Total Traffic: 42.0 GB
FLAG{APACHE_STATUS_IN_VERCEL_EDGE_WTF}
Architect: @lonestill in Telegram
`;
    return new NextResponse(fakeStatus, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Easter-Egg": "Fake-Apache-Status",
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ЗАЩИТА ОТ АВТОМАТИЗИРОВАННЫХ СКАНЕРОВ (GZIP-БОМБА / EDGE DROP)
  // ══════════════════════════════════════════════════════════════

  const isScannerUA = SCANNER_UA_REGEX.test(userAgent);
  const isProtectedAdmin = pathname.startsWith("/admin");
  const isSuspiciousPath =
    !isProtectedAdmin &&
    (SUSPICIOUS_PATHS_REGEX.test(pathname) || TRAVERSAL_REGEX.test(pathname));

  // Если запрос безопасный и нормальный — пропускаем дальше и подкидываем пасхальную куку
  if (!isScannerUA && !isSuspiciousPath) {
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", "80");
    response.cookies.set(
      "X-Easter-Egg-Cookie",
      "FLAG{INSPECTING_COOKIES_LIKE_A_PRO_LONESTILL}",
      { path: "/", httpOnly: false, sameSite: "lax" }
    );
    return response;
  }

  // ЕСЛИ ЭТО СКАНЕР / ФАЗЗЕР — ЛОМАЕМ НА УРОВНЕ EDGE
  if (acceptEncoding.includes("gzip")) {
    const bomb = getGzipBomb();
    return new NextResponse(bomb as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Encoding": "gzip",
        "X-Defense-System": "OSS-Hub-Gzip-Trap",
        "X-Scanner-Detected": "true",
        "X-Message": "Enjoy your OOM killer. Contact @lonestill on Telegram.",
      },
    });
  }

  // Без gzip — мгновенный 418 I'm a teapot
  return new NextResponse(
    `[!] ACCESS DENIED: Automated scanner / probe pattern detected.
IP logged. Report legitimate vulnerabilities to https://t.me/lonestill
`,
    {
      status: 418,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Defense-System": "OSS-Hub-Edge-Drop",
        "X-Scanner-Detected": "true",
      },
    }
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml).*)",
  ],
};
