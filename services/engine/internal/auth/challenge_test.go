package auth

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func TestChallengeIssueVerify(t *testing.T) {
	srv, err := miniredis.Run()
	require.NoError(t, err)
	defer srv.Close()

	rdb := redis.NewClient(&redis.Options{Addr: srv.Addr()})
	defer func() { _ = rdb.Close() }()

	svc := &ChallengeService{RDB: rdb}
	ctx := context.Background()

	ch1, err := svc.IssueChallenge(ctx, "alice")
	require.NoError(t, err)
	require.NotEmpty(t, ch1.Nonce)

	ok := svc.VerifyChallenge(ctx, "alice", ch1.Nonce)
	require.True(t, ok)

	ok = svc.VerifyChallenge(ctx, "alice", ch1.Nonce)
	require.False(t, ok)
}

func TestChallengeLimit(t *testing.T) {
	srv, err := miniredis.Run()
	require.NoError(t, err)
	defer srv.Close()

	rdb := redis.NewClient(&redis.Options{Addr: srv.Addr()})
	defer func() { _ = rdb.Close() }()

	svc := &ChallengeService{RDB: rdb}
	ctx := context.Background()

	for i := 0; i < maxActivePerUser; i++ {
		_, err := svc.IssueChallenge(ctx, "bob")
		require.NoError(t, err)
	}
	_, err = svc.IssueChallenge(ctx, "bob")
	require.Error(t, err)
}
