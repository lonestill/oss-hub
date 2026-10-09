"use client";

import { useEffect, useRef } from "react";

export function ConsoleEasterEgg() {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const ascii = `
  ██████╗  ███████╗ ███████╗    ██╗  ██╗ ██╗   ██╗ ██████╗ 
 ██╔═══██╗ ██╔════╝ ██╔════╝    ██║  ██║ ██║   ██║ ██╔══██╗
 ██║   ██║ ███████╗ ███████╗    ███████║ ██║   ██║ ██████╔╝
 ██║   ██║ ╚════██║ ╚════██║    ██╔══██║ ██║   ██║ ██╔══██╗
 ╚██████╔╝ ███████║ ███████║    ██║  ██║ ╚██████╔╝ ██████╔╝
  ╚═════╝  ╚══════╝ ╚══════╝    ╚═╝  ╚═╝  ╚═════╝  ╚═════╝ 
`;

    // Красный цвет для ASCII-арта
    console.log(
      `%c${ascii}`,
      "color: #e5484d; font-family: monospace; font-size: 11px; font-weight: bold; line-height: 1.2;"
    );

    // Белый и зелёный цвета для дерзкого сообщения хакерам
    console.log(
      "%c[!] Ищешь XSS, SQLi или админку? Дырки ищут только слабаки, реальные пацаны пишут в Telegram автору. Нашёл реальный баг — пиши %c@lonestill%c.",
      "color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 500;",
      "color: #22c55e; font-family: sans-serif; font-size: 13px; font-weight: bold; text-decoration: underline;",
      "color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 500;"
    );
  }, []);

  return null;
}
