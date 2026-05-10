package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisRateLimiter implements simple fixed-window counters stored in Redis.
type RedisRateLimiter struct {
	RDB     *redis.Client
	Limit   int
	Window  time.Duration
	KeyPref string
}

// Allow returns false when the rolling window counter exceeds the configured limit.
func (r *RedisRateLimiter) Allow(ctx context.Context, scope string) (bool, error) {
	if r == nil || r.RDB == nil {
		return true, nil
	}
	if scope == "" {
		scope = "anonymous"
	}
	if r.Limit <= 0 || r.Window <= 0 {
		return true, nil
	}
	key := fmt.Sprintf("%s:%s", r.KeyPref, scope)

	n, err := r.RDB.Incr(ctx, key).Result()
	if err != nil {
		return false, err
	}
	if n == 1 {
		if err := r.RDB.Expire(ctx, key, r.Window).Err(); err != nil {
			return false, err
		}
	}
	return n <= int64(r.Limit), nil
}
