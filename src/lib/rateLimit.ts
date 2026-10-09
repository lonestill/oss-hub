interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private maxEntries = 5000;

  constructor(
    private windowMs: number,
    private maxRequests: number,
    private blockDurationMs: number = 0
  ) {}

  check(key: string): {
    success: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const record = this.store.get(key);

    // If blocked
    if (record?.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Clean expired record or create new
    if (!record || record.resetAt <= now) {
      if (this.store.size >= this.maxEntries) {
        const firstKey = this.store.keys().next().value;
        if (firstKey) this.store.delete(firstKey);
      }

      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.store.set(key, newRecord);
      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetAt: newRecord.resetAt,
      };
    }

    // Increment
    record.count++;
    if (record.count > this.maxRequests) {
      if (this.blockDurationMs > 0 && !record.blockedUntil) {
        record.blockedUntil = now + this.blockDurationMs;
      }
      const retryAfter = record.blockedUntil
        ? Math.ceil((record.blockedUntil - now) / 1000)
        : Math.ceil((record.resetAt - now) / 1000);

      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      success: true,
      remaining: Math.max(0, this.maxRequests - record.count),
      resetAt: record.resetAt,
    };
  }
}

// 1. Глобальный лимит на обычный браузинг: 80 запросов в 60 сек на IP
export const globalEdgeLimiter = new InMemoryRateLimiter(60 * 1000, 80, 60 * 1000);

// 2. Лимит на логин в админку: 20 попыток в минуту. Превысил — бан на 60 сек
export const adminLoginEdgeLimiter = new InMemoryRateLimiter(60 * 1000, 20, 60 * 1000);

// 3. Лимит на API эндпоинты: 25 запросов в минуту
export const apiEdgeLimiter = new InMemoryRateLimiter(60 * 1000, 25, 60 * 1000);

// 4. Лимит на комментарии: не чаще 1 раза в 5 секунд, макс 6 в минуту
export const commentActionLimiter = new InMemoryRateLimiter(60 * 1000, 6, 30 * 1000);

// 5. Лимит на добавление репозиториев: не чаще 1 раза в 15 секунд, макс 4 в 5 минут
export const submitActionLimiter = new InMemoryRateLimiter(5 * 60 * 1000, 4, 60 * 1000);

// 6. Лимит на ввод мастер-пароля админки: 5 попыток в 5 минут, бан на 10 минут
export const adminPasswordActionLimiter = new InMemoryRateLimiter(5 * 60 * 1000, 5, 10 * 60 * 1000);
