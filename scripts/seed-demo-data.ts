import { client, initDb } from "../src/lib/db";

async function seed() {
  await initDb();

  const slug = "lonestill-playground";
  const res = await client.execute({
    sql: "SELECT id FROM projects WHERE slug = ? LIMIT 1",
    args: [slug],
  });

  if (res.rows.length === 0) {
    console.error(`Project ${slug} not found!`);
    process.exit(1);
  }

  const projectId = String(res.rows[0].id);
  const now = Date.now();

  console.log(`Seeding demo data for project: ${slug} (${projectId})...`);

  // 1. Очищаем старые данные проекта
  await client.execute({
    sql: "DELETE FROM task_messages WHERE project_id = ?",
    args: [projectId],
  });
  await client.execute({
    sql: "DELETE FROM task_claims WHERE project_id = ?",
    args: [projectId],
  });
  await client.execute({
    sql: "DELETE FROM team_applications WHERE project_id = ?",
    args: [projectId],
  });

  // 2. Наполняем contributor_tasks и team_roles_data
  const contributorTasks = [
    {
      id: "task_auth_refactor",
      issue_number: 1,
      source: "manual",
      title: "Рефакторинг OAuth сессий и ротации токенов",
      description: "Перевести авторизацию на безопасную связку cookie + HMAC с поддержкой сессий в Turso и graceful fallback при истечении access токена GitHub.",
      difficulty: "hard",
      tags: ["Auth", "Security", "TypeScript", "Next.js"],
      status: "in_progress",
      created_at: now - 3600000 * 48,
      updated_at: now - 3600000 * 12,
    },
    {
      id: "task_perf_optim",
      issue_number: 2,
      source: "manual",
      title: "Оптимизация Server Components и бандла",
      description: "Устранить лишние ре-рендеры на главной витрине, настроить кэширование словарей i18n и ускорить Turbopack cold start.",
      difficulty: "medium",
      tags: ["Performance", "React 19", "Next.js"],
      status: "open",
      created_at: now - 3600000 * 24,
      updated_at: now - 3600000 * 6,
    },
    {
      id: "gh_14",
      issue_number: 14,
      source: "github",
      title: "Fix: race condition in WebSocket heartbeat disconnects",
      description: "Under high latency network conditions, heartbeat interval overlaps and drops active connection.",
      difficulty: "medium",
      tags: ["Bug", "Network", "WebSocket"],
      status: "open",
      created_at: now - 3600000 * 72,
      updated_at: now - 3600000 * 18,
    },
    {
      id: "gh_21",
      issue_number: 21,
      source: "github",
      title: "Docs & setup: Quickstart guide for self-hosting with Docker",
      description: "Подготовить docker-compose.yml и подробную инструкцию по развертыванию OSS Hub на собственном сервере с SQLite/Turso.",
      difficulty: "easy",
      tags: ["Documentation", "Docker", "DevOps"],
      status: "open",
      created_at: now - 3600000 * 12,
      updated_at: now - 3600000 * 2,
    },
  ];

  const teamRolesData = [
    {
      role: "Tech Lead / Backend Architect",
      title: "Tech Lead / Backend Architect",
      commitment: "10-15 ч/нед",
      description: "Проектирование API, защита от уязвимостей (OWASP), аудит PR и оптимизация запросов к БД.",
      open: true,
    },
    {
      role: "Frontend / UX Engineer",
      title: "Frontend / UX Engineer",
      commitment: "5-10 ч/нед",
      description: "Развитие дизайн-системы, микровзаимодействия, доступность и адаптив для мобильных устройств.",
      open: true,
    },
    {
      role: "DevOps & Infrastructure SRE",
      title: "DevOps & Infrastructure SRE",
      commitment: "5-10 ч/нед",
      description: "CI/CD пайплайны в GitHub Actions, мониторинг продовой инфраструктуры, автоматизация бэкапов.",
      open: true,
    },
  ];

  await client.execute({
    sql: `UPDATE projects SET 
            contributor_tasks = ?, 
            team_roles_data = ?, 
            looking_for_contributors = 1,
            moderation_status = 'approved',
            moderation_score = 100,
            quickstart_command = 'git clone https://github.com/lonestill/playground.git && bun install && bun run dev'
          WHERE id = ?`,
    args: [JSON.stringify(contributorTasks), JSON.stringify(teamRolesData), projectId],
  });

  // 3. Создаем кандидатов и заявки (task_claims)

  // Заявка 1: Алексей (Назначен, в работе, есть PR, ждёт ответа)
  const claim1Id = "claim_demo_alex_auth";
  await client.execute({
    sql: `INSERT INTO task_claims (
            id, project_id, project_slug, issue_number, issue_title, task_id, source,
            user_login, user_name, user_avatar, pitch, status, pr_url, internal_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      claim1Id,
      projectId,
      slug,
      1,
      "Рефакторинг OAuth сессий и ротации токенов",
      "task_auth_refactor",
      "manual",
      "alex_dev",
      "Алексей Морозов",
      "https://avatars.githubusercontent.com/u/1024025?v=4",
      "Писал OAuth2 шлюз на Go и TypeScript. Разберусь за пару дней, покрою тестами Vitest и сделаю чистый fallback.",
      "assigned",
      "https://github.com/lonestill/playground/pull/18",
      "Алексей сильный по бэкенду. Договорились о дедлайне до конца недели.",
      now - 3600000 * 36,
      now - 3600000 * 2,
    ],
  });

  // Сообщения в диалоге с Алексеем
  await client.execute({
    sql: `INSERT INTO task_messages (id, claim_id, project_id, sender_login, sender_name, sender_avatar, is_author, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "msg_1",
      claim1Id,
      projectId,
      "lonestill",
      "Lonestill",
      "https://github.com/lonestill.png",
      1,
      "Привет! Посмотрел драфт PR, выглядит бодро. Обрати внимание на типизацию payload в auth.ts.",
      now - 3600000 * 5,
    ],
  });

  await client.execute({
    sql: `INSERT INTO task_messages (id, claim_id, project_id, sender_login, sender_name, sender_avatar, is_author, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "msg_2",
      claim1Id,
      projectId,
      "alex_dev",
      "Алексей Морозов",
      "https://avatars.githubusercontent.com/u/1024025?v=4",
      0, // Контрибьютор написал -> Очередь внимания «Ждёт ответа»!
      "Поправил типы и добавил тест на проверку истекшего HMAC-токена. Глянешь свежий коммит?",
      now - 3600000 * 2,
    ],
  });

  // Заявка 2: Елена Ростова (Кандидат на задачу #2, ждёт ответа)
  const claim2Id = "claim_demo_elena_perf";
  await client.execute({
    sql: `INSERT INTO task_claims (
            id, project_id, project_slug, issue_number, issue_title, task_id, source,
            user_login, user_name, user_avatar, pitch, status, pr_url, internal_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      claim2Id,
      projectId,
      slug,
      2,
      "Оптимизация Server Components и бандла",
      "task_perf_optim",
      "manual",
      "elena_rostova",
      "Елена Ростова",
      "https://avatars.githubusercontent.com/u/2048050?v=4",
      "Занимаюсь веб-перформансом 4 года, контрибьютила в UI библиотеки. Срежу бандл на 35% и уберу layout shifts.",
      "pending",
      null,
      "Очень годный профиль, глянул её пулреквесты в экосистеме Next.js. Кандидат №1.",
      now - 3600000 * 18,
      now - 3600000 * 4,
    ],
  });

  await client.execute({
    sql: `INSERT INTO task_messages (id, claim_id, project_id, sender_login, sender_name, sender_avatar, is_author, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "msg_3",
      claim2Id,
      projectId,
      "elena_rostova",
      "Елена Ростова",
      "https://avatars.githubusercontent.com/u/2048050?v=4",
      0, // Ждёт ответа в Attention Queue!
      "Добрый вечер! Подскажи, какой бандл-анализатор предпочитаете в проекте — @next/bundle-analyzer или внешний скрипт?",
      now - 3600000 * 4,
    ],
  });

  // Заявка 3: Дмитрий Коваль (Конкурент Елены на задачу #2)
  const claim3Id = "claim_demo_dmitry_perf";
  await client.execute({
    sql: `INSERT INTO task_claims (
            id, project_id, project_slug, issue_number, issue_title, task_id, source,
            user_login, user_name, user_avatar, pitch, status, pr_url, internal_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      claim3Id,
      projectId,
      slug,
      2,
      "Оптимизация Server Components и бандла",
      "task_perf_optim",
      "manual",
      "dmitry_k",
      "Дмитрий Коваль",
      "https://avatars.githubusercontent.com/u/3096075?v=4",
      "Могу перетрясти стили и Tailwind конфиг, убрать неиспользуемые классы.",
      "pending",
      null,
      "Менее релевантно, чем у Елены, но можно предложить ему задачу по верстке.",
      now - 3600000 * 14,
      now - 3600000 * 14,
    ],
  });

  // Заявка 4: Сергей Волков (Задача #14, успешно завершена)
  const claim4Id = "claim_demo_sergey_done";
  await client.execute({
    sql: `INSERT INTO task_claims (
            id, project_id, project_slug, issue_number, issue_title, task_id, source,
            user_login, user_name, user_avatar, pitch, status, pr_url, internal_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      claim4Id,
      projectId,
      slug,
      14,
      "Fix: race condition in WebSocket heartbeat disconnects",
      "gh_14",
      "github",
      "sergey_volkov",
      "Сергей Волков",
      "https://avatars.githubusercontent.com/u/4192080?v=4",
      "Разобрался с race condition в ws handler, сделал пулреквест с фиксом таймеров.",
      "completed",
      "https://github.com/lonestill/playground/pull/15",
      "Пулреквест проверен и смержен в main. Отличная работа.",
      now - 3600000 * 48,
      now - 3600000 * 10,
    ],
  });

  // 4. Отклики в команду (team_applications)
  await client.execute({
    sql: `INSERT INTO team_applications (
            id, project_id, project_slug, role, user_login, user_name, user_avatar, experience, contacts, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "app_1",
      projectId,
      slug,
      "DevOps & Infrastructure SRE",
      "kirill_ops",
      "Кирилл Смирнов",
      "https://avatars.githubusercontent.com/u/5284090?v=4",
      "5 лет опыта в k8s, Docker и CI/CD. Настрою GitHub Actions с параллельным прогоном тестов и деплоем на прод без даунтайма.",
      "Telegram: @kirill_sre | Email: kirill@infra.io",
      "pending",
      now - 3600000 * 8,
      now - 3600000 * 8,
    ],
  });

  await client.execute({
    sql: `INSERT INTO team_applications (
            id, project_id, project_slug, role, user_login, user_name, user_avatar, experience, contacts, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "app_2",
      projectId,
      slug,
      "Frontend / UX Engineer",
      "maria_design",
      "Мария Соколова",
      "https://avatars.githubusercontent.com/u/6395100?v=4",
      "Figma + Tailwind + React 19. Делала дизайн-системы для open-source каталогов, готова навести порядок в отступах и типографике.",
      "Telegram: @maria_ui",
      "pending",
      now - 3600000 * 16,
      now - 3600000 * 16,
    ],
  });

  console.log("Demo data successfully seeded!");
  console.log(`- 4 Tasks (2 manual + 2 GitHub issues)`);
  console.log(`- 4 Task claims (1 assigned with PR, 2 pending competing, 1 completed)`);
  console.log(`- 3 Chat messages`);
  console.log(`- 3 Team roles`);
  console.log(`- 2 Team applications`);
}

seed().catch((err) => {
  console.error("Failed to seed demo data:", err);
  process.exit(1);
});
