package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	challengeWindow   = 5 * time.Minute
	maxActivePerUser  = 10
	challengeKeyFmt   = "auth:challenges:%s"
)

// ChallengeService stores wallet-login challenges in Redis with TTL + cardinality caps.
type ChallengeService struct {
	RDB *redis.Client
}

// ChallengeIssue bundles a nonce and absolute expiry for clients.
type ChallengeIssue struct {
	Nonce     string
	ExpiresAt time.Time
}

// IssueChallenge creates a nonce with a 5-minute TTL and enforces at most 10 active challenges per user.
func (s *ChallengeService) IssueChallenge(ctx context.Context, username string) (*ChallengeIssue, error) {
	if s == nil || s.RDB == nil {
		return nil, errors.New("redis client required")
	}
	if username == "" {
		return nil, errors.New("username required")
	}
	key := fmt.Sprintf(challengeKeyFmt, username)
	now := time.Now().UTC()
	deadline := now.Add(challengeWindow).UnixMilli()

	pipe := s.RDB.TxPipeline()
	pipe.ZRemRangeByScore(ctx, key, "-inf", fmt.Sprintf("%d", now.UnixMilli()))
	countCmd := pipe.ZCard(ctx, key)
	_, err := pipe.Exec(ctx)
	if err != nil {
		return nil, err
	}
	if countCmd.Val() >= maxActivePerUser {
		return nil, errors.New("challenge limit reached")
	}

	nonce := make([]byte, 32)
	if _, err := rand.Read(nonce); err != nil {
		return nil, fmt.Errorf("nonce: %w", err)
	}
	ns := hex.EncodeToString(nonce)

	pipe = s.RDB.TxPipeline()
	pipe.ZAdd(ctx, key, redis.Z{
		Score:  float64(deadline),
		Member: ns,
	})
	pipe.Expire(ctx, key, challengeWindow+30*time.Second)
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}

	return &ChallengeIssue{
		Nonce:     ns,
		ExpiresAt: time.UnixMilli(deadline).UTC(),
	}, nil
}

// VerifyChallenge validates a nonce and removes it (single use).
func (s *ChallengeService) VerifyChallenge(ctx context.Context, username, nonce string) bool {
	if s == nil || s.RDB == nil {
		return false
	}
	if username == "" || nonce == "" {
		return false
	}
	key := fmt.Sprintf(challengeKeyFmt, username)
	now := time.Now().UTC().UnixMilli()

	score, err := s.RDB.ZScore(ctx, key, nonce).Result()
	if err != nil {
		return false
	}
	if float64(now) > score {
		_, _ = s.RDB.ZRem(ctx, key, nonce).Result()
		return false
	}
	if _, err := s.RDB.ZRem(ctx, key, nonce).Result(); err != nil {
		return false
	}
	return true
}
