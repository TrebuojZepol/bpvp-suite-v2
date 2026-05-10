package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

// RefreshTokenStore persists hashed refresh tokens for rotation flows.
type RefreshTokenStore struct {
	DB *sql.DB
}

// IssueRefreshToken replaces any existing refresh token row for the user and stores a new SHA-256 hash.
func (s *RefreshTokenStore) IssueRefreshToken(ctx context.Context, username string, ttl time.Duration) (plaintext string, err error) {
	if s == nil || s.DB == nil {
		return "", errors.New("database required")
	}
	if username == "" {
		return "", errors.New("username required")
	}
	if ttl <= 0 {
		return "", errors.New("ttl required")
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("entropy: %w", err)
	}
	plain := hex.EncodeToString(raw)
	sum := sha256.Sum256([]byte(plain))
	expires := time.Now().UTC().Add(ttl)

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `DELETE FROM refresh_tokens WHERE username=$1`, username); err != nil {
		return "", err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO refresh_tokens (username, token_hash, expires_at) VALUES ($1, $2, $3)`,
		username, sum[:], expires,
	); err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", err
	}
	return plain, nil
}

// RotateRefreshToken validates a refresh token hash and rotates storage (single-use semantics).
func (s *RefreshTokenStore) RotateRefreshToken(ctx context.Context, oldPlain string, ttl time.Duration) (username string, newPlain string, err error) {
	if s == nil || s.DB == nil {
		return "", "", errors.New("database required")
	}
	if oldPlain == "" {
		return "", "", errors.New("token required")
	}
	if ttl <= 0 {
		return "", "", errors.New("ttl required")
	}
	oldSum := sha256.Sum256([]byte(oldPlain))

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return "", "", err
	}
	defer func() { _ = tx.Rollback() }()

	var user string
	var expiresAt time.Time
	row := tx.QueryRowContext(ctx,
		`SELECT username, expires_at FROM refresh_tokens WHERE token_hash=$1 FOR UPDATE`,
		oldSum[:],
	)
	if err := row.Scan(&user, &expiresAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", "", errors.New("refresh token not found")
		}
		return "", "", err
	}
	if time.Now().UTC().After(expiresAt) {
		return "", "", errors.New("refresh token expired")
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM refresh_tokens WHERE token_hash=$1`, oldSum[:]); err != nil {
		return "", "", err
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", fmt.Errorf("entropy: %w", err)
	}
	newPlain = hex.EncodeToString(raw)
	newSum := sha256.Sum256([]byte(newPlain))
	expires := time.Now().UTC().Add(ttl)
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO refresh_tokens (username, token_hash, expires_at) VALUES ($1, $2, $3)`,
		user, newSum[:], expires,
	); err != nil {
		return "", "", err
	}
	if err := tx.Commit(); err != nil {
		return "", "", err
	}
	return user, newPlain, nil
}
