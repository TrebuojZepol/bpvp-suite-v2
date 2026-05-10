package auth

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func TestRedisRateLimiter_Allow(t *testing.T) {
	srv, err := miniredis.Run()
	require.NoError(t, err)
	defer srv.Close()

	rdb := redis.NewClient(&redis.Options{Addr: srv.Addr()})
	defer func() { _ = rdb.Close() }()

	lim := &RedisRateLimiter{
		RDB:     rdb,
		Limit:   2,
		Window:  time.Minute,
		KeyPref: "test",
	}
	ctx := context.Background()

	ok, err := lim.Allow(ctx, "scope-a")
	require.NoError(t, err)
	require.True(t, ok)
	ok, err = lim.Allow(ctx, "scope-a")
	require.NoError(t, err)
	require.True(t, ok)
	ok, err = lim.Allow(ctx, "scope-a")
	require.NoError(t, err)
	require.False(t, ok)
}

func TestRedisRateLimiter_NilAllows(t *testing.T) {
	var lim *RedisRateLimiter
	ok, err := lim.Allow(context.Background(), "x")
	require.NoError(t, err)
	require.True(t, ok)
}
