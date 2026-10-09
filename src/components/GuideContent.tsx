"use client";

import { useState } from "react";
import {
  Compass,
  Users,
  LayoutDashboard,
  Terminal,
  GitPullRequest,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileCode,
  Sparkles,
  Layers,
  Search,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

type GuideTab = "contributors" | "maintainers" | "faq";

interface GuideContentProps {
  initialTab?: GuideTab;
}

export function GuideContent({ initialTab = "contributors" }: GuideContentProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab);

  return (
    <div className="space-y-8">
      {/* 1. Header Hero */}
      <section className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#e5484d]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-xs font-semibold border border-[#e5484d]/20">
            <Compass className="w-3.5 h-3.5" />
            <span>База знаний платформы</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Руководство по работе с OSS Hub
          </h1>

          <p className="text-sm text-[#8a92a3] leading-relaxed">
            Полноценная инструкция для авторов репозиториев и контрибьюторов. Узнайте, как организовать воронку разработки, брать задачи в один клик и вступать в постоянные open-source команды.
          </p>

          {/* Tab Navigation Controls */}
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("contributors")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "contributors"
                  ? "bg-[#e5484d] text-white shadow-md shadow-[#e5484d]/20"
                  : "bg-[#151821] text-[#8a92a3] hover:text-white border border-[#1d212b]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Для контрибьюторов</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("maintainers")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "maintainers"
                  ? "bg-[#e5484d] text-white shadow-md shadow-[#e5484d]/20"
                  : "bg-[#151821] text-[#8a92a3] hover:text-white border border-[#1d212b]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Для мейнтейнеров & CRM</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === "faq"
                  ? "bg-[#e5484d] text-white shadow-md shadow-[#e5484d]/20"
                  : "bg-[#151821] text-[#8a92a3] hover:text-white border border-[#1d212b]"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Сравнение с GitHub & FAQ</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. TAB 1: CONTRIBUTORS GUIDE */}
      {activeTab === "contributors" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-white text-sm">Найдите проект по душе</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Фильтруйте репозитории по языку программирования, уровню сложности и тегам `Good First Issue`.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#e5484d]/10 text-[#e5484d] flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Забронируйте задачу (Claim)</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Напишите короткий питч своего решения. Автор рассмотрит его и назначит задачу на вас, защитив от дублирования.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 text-[#3fb950] flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-white text-sm">Вступайте в Core Team</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Подавайте заявки на долгосрочные роли: Backend, Frontend, DevOps, ревьювер архитектуры или ментор.
              </p>
            </div>
          </div>

          {/* Deep-dive Walkthrough */}
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#1d212b] pb-4">
              <h2 className="text-xl font-bold text-white">
                Пошаговый процесс контрибьютора
              </h2>
              <p className="text-xs text-[#8a92a3] mt-1">
                От поиска первого таска до подтверждения в ростере участников
              </p>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  01
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Быстрый запуск репозитория (Fast-Track Onboarding)
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    На странице каждого проекта мейнтейнер оставляет проверенную команду для запуска в один клик:
                  </p>
                  <div className="p-3 rounded-lg bg-[#151821] border border-[#1d212b] font-mono text-xs text-[#38bdf8] flex items-center justify-between">
                    <span>git clone https://github.com/... && cd ... && bun install && bun run dev</span>
                    <span className="text-[10px] text-[#8a92a3] uppercase font-bold">1-Liner</span>
                  </div>
                  <p className="text-xs text-[#8a92a3]">
                    Также изучайте карту ключевых файлов архитектуры (Architecture Map), чтобы не блуждать по тысячам строк чужого кода.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  02
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Подача заявки на задачу: почему питч критически важен
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    Когда вы нажимаете «Взять в работу» на задаче или issue, открывается форма питча. Опишите свой подход в 2-3 предложениях.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg border border-[#e5484d]/30 bg-[#e5484d]/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5484d]">
                        <X className="w-3.5 h-3.5" />
                        <span>Плохой питч (отклонят)</span>
                      </div>
                      <p className="text-[11px] text-[#8a92a3] italic">
                        «Привет, дай задачу, хочу покодить.»
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#3fb950]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Отличный питч (одобрят сразу)</span>
                      </div>
                      <p className="text-[11px] text-[#d1d5db]">
                        «Переведу валидацию на Zod schema в `src/actions.ts`, добавлю типизированную обработку ошибок и напишу 3 теста. Займет около 3-4 часов.»
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  03
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Диалог с автором и отправка Pull Request
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    Как только автор переводит заявку в статус «В работе», в карточке задачи открывается прямой диалог с автором. Вы можете задавать вопросы по архитектуре, а когда закончите — прикрепить ссылку на ваш GitHub PR.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  04
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Ростер контрибьюторов и рост профиля
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    После мерджа PR автор переводит задачу в «Завершено», а вы автоматически попадаете в публичный ростер участников проекта. Ваш публичный профиль на OSS Hub пополняется подтвержденными достижениями, которые видят другие разработчики и работодатели.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-6 rounded-2xl border border-[#1d212b] bg-[#151821] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Готовы внести свой первый вклад?</h4>
              <p className="text-xs text-[#8a92a3]">
                Перейдите к каталогу проектов, где авторы активно ждут помощи.
              </p>
            </div>
            <Link
              href="/contributors"
              className="px-5 py-2.5 rounded-xl bg-[#e5484d] hover:bg-[#d63d42] text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-[#e5484d]/20"
            >
              <span>Смотреть открытые задачи</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. TAB 2: MAINTAINERS & CRM GUIDE */}
      {activeTab === "maintainers" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* CRM Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#e5484d]/10 text-[#e5484d] flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Выделенный воркспейс CRM</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Доступен по прямому адресу `/projects/[slug]/crm`. Никакой визуальной перегрузки — только управление репозиторием.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">4-колоночный канбан</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Контролируйте воронку: от новых входящих питчей до PR на ревью и замерженных в main фич.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#1d212b] bg-[#0f1117] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 text-[#3fb950] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Формирование команды</h3>
              <p className="text-xs text-[#8a92a3] leading-relaxed">
                Публикуйте постоянные роли с описанием требуемого времени и принимайте проверенных специалистов.
              </p>
            </div>
          </div>

          {/* Deep-dive Walkthrough */}
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#1d212b] pb-4">
              <h2 className="text-xl font-bold text-white">
                Как выжать максимум из Maintainer CRM
              </h2>
              <p className="text-xs text-[#8a92a3] mt-1">
                Гайд по настройке параметров проекта и работе с воронкой
              </p>
            </div>

            <div className="space-y-6">
              {/* Maintainer Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  01
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Добавление репозитория в каталог
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    Авторизуйтесь через GitHub и перейдите на страницу <Link href="/submit" className="text-[#e5484d] hover:underline font-semibold">«Добавить проект»</Link>. Выберите ваш публичный репозиторий в один клик. Платформа сама подтянет звезды, форки, README и открытые issues.
                  </p>
                </div>
              </div>

              {/* Maintainer Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  02
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Настройка онбординга (Onboarding & .env)
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    В разделе «Онбординг & .env» вашей CRM укажите команду для быстрого старта (1-liner Quickstart) и карту архитектуры:
                  </p>
                  <ul className="text-xs text-[#8a92a3] space-y-1 list-disc list-inside">
                    <li><strong className="text-white">1-liner Quickstart:</strong> строка в терминал, которая клонирует, ставит зависимости и запускает сервер.</li>
                    <li><strong className="text-white">Карта ключевых файлов:</strong> укажите 3-4 главных файла (точка входа, роутинг, подключение к базе данных). Это сокращает время въезда новичка на 80%.</li>
                    <li><strong className="text-white">Шаблон .env:</strong> безопасный пример конфигурации без секретных ключей.</li>
                  </ul>
                </div>
              </div>

              {/* Maintainer Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  03
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Управление воронкой в Канбане
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    Когда кандидат отправляет отклик, он попадает в колонку <strong className="text-[#f78166]">«Новые заявки»</strong>.
                  </p>
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Клик по заявке открывает Drawer Chat:</span>
                    </div>
                    <p className="text-[#8b949e]">
                      Вы можете ознакомиться с питчем кандидата, задать уточняющие вопросы прямо на платформе и нажать «В работу». Статус синхронизируется мгновенно.
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintainer Step 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#161a23] border border-[#2e3444] text-white flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                  04
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    Полноэкранный режим (Fullscreen)
                  </h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">
                    Нажмите иконку расширения в верхнем правом углу шапки CRM, чтобы развернуть воркспейс во весь экран монитора. Никаких рамок сайта и скроллбаров — чистая рабочая среда, как в Linear или GitHub Projects.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-6 rounded-2xl border border-[#1d212b] bg-[#151821] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">У вас есть публичный проект?</h4>
              <p className="text-xs text-[#8a92a3]">
                Опубликуйте репозиторий и начните собирать команду единомышленников уже сегодня.
              </p>
            </div>
            <Link
              href="/submit"
              className="px-5 py-2.5 rounded-xl bg-[#e5484d] hover:bg-[#d63d42] text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-[#e5484d]/20"
            >
              <span>Опубликовать репозиторий</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. TAB 3: FAQ & COMPARISON */}
      {activeTab === "faq" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Comparison Table */}
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                OSS Hub vs Обычный GitHub Issues
              </h2>
              <p className="text-xs text-[#8a92a3] mt-1">
                Почему разработка на платформе решает ключевые боли open-source разработки
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#1d212b] text-[#8a92a3]">
                    <th className="py-3 px-4 font-semibold">Критерий</th>
                    <th className="py-3 px-4 font-semibold text-[#8a92a3]">Обычный GitHub</th>
                    <th className="py-3 px-4 font-semibold text-[#e5484d]">OSS Hub + CRM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d212b]">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Статус задач</td>
                    <td className="py-3 px-4 text-[#8a92a3]">Брошенные issues без ответов месяцами</td>
                    <td className="py-3 px-4 text-white font-medium">Канбан-воронка с четкими этапами выполнения</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Дублирование работы</td>
                    <td className="py-3 px-4 text-[#8a92a3]">Несколько людей одновременно пилят один и тот же фикс</td>
                    <td className="py-3 px-4 text-white font-medium">Система клеймов (Claims) резервирует задачу за одним исполнителем</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Локальный запуск</td>
                    <td className="py-3 px-4 text-[#8a92a3]">Нужно выискивать шаги в неполных инструкциях</td>
                    <td className="py-3 px-4 text-white font-medium">1-liner Quickstart, карта архитектуры и шаблон `.env`</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Поиск команды</td>
                    <td className="py-3 px-4 text-[#8a92a3]">Нет встроенного механизма найма кодеров в Core Team</td>
                    <td className="py-3 px-4 text-white font-medium">Team Finder с описанием требуемой занятости (ч/нед)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Коммуникация</td>
                    <td className="py-3 px-4 text-[#8a92a3]">Публичный флуд в комментариях к issue</td>
                    <td className="py-3 px-4 text-white font-medium">Приватный тред между автором и контрибьютором в CRM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="rounded-2xl border border-[#1d212b] bg-[#0f1117] p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Часто задаваемые вопросы</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#1d212b] bg-[#151821] space-y-1.5">
                <span className="font-bold text-white text-xs block">
                  Как подтверждается авторство репозитория?
                </span>
                <p className="text-xs text-[#8a92a3] leading-relaxed">
                  При входе через GitHub платформа сверяет ваш логин со статусом владельца репозитория. Если логины совпадают, вам автоматически открывается Maintainer CRM и панель управления проектом.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1d212b] bg-[#151821] space-y-1.5">
                <span className="font-bold text-white text-xs block">
                  Платформа бесплатная?
                </span>
                <p className="text-xs text-[#8a92a3] leading-relaxed">
                  Да, OSS Hub полностью бесплатен для мейнтейнеров и разработчиков. Исходный код самой платформы открыт.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1d212b] bg-[#151821] space-y-1.5">
                <span className="font-bold text-white text-xs block">
                  Что делать, если контрибьютор взял задачу и пропал?
                </span>
                <p className="text-xs text-[#8a92a3] leading-relaxed">
                  В CRM-воркспейсе мейнтейнер может в любой момент снять назначение с неактивного кандидата и вернуть задачу в статус открытой для других участников.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#1d212b] bg-[#151821] space-y-1.5">
                <span className="font-bold text-white text-xs block">
                  Как модерируются проекты?
                </span>
                <p className="text-xs text-[#8a92a3] leading-relaxed">
                  Каждый репозиторий проходит первичную автоматическую и ручную проверку на безопасность, соответствие критериям open-source и отсутствие вредоносного кода перед попаданием в общий топ каталога.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
