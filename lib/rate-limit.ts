type RateBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __homelixRateBuckets: Map<string, RateBucket> | undefined;
}

const buckets = globalThis.__homelixRateBuckets ?? new Map<string, RateBucket>();
globalThis.__homelixRateBuckets = buckets;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(request: Request, scope: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = `${scope}:${clientIp(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: current.count <= options.limit,
    remaining: Math.max(0, options.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    { error: "Слишком много запросов. Подождите немного и попробуйте снова." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining)
      }
    }
  );
}
