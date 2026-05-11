// Command seed upserts a development user into PostgreSQL (same Argon2id format as auth).
//
// Usage:
//
//	BPVP_DATABASE_URL=postgres://... BPVP_SEED_PASSWORD='yourpass' go run ./cmd/seed
//
// Optional: BPVP_SEED_USERNAME (default trebuoj), BPVP_SEED_ROLE (default trader).
// Use role "admin" only if you also enroll TOTP (admin requires MFA).
package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"github.com/bpvp-suite-v2/services/engine/internal/auth"
)

func main() {
	dsn := os.Getenv("BPVP_DATABASE_URL")
	if dsn == "" {
		fmt.Fprintln(os.Stderr, "error: BPVP_DATABASE_URL is required")
		os.Exit(1)
	}
	username := os.Getenv("BPVP_SEED_USERNAME")
	if username == "" {
		username = "trebuoj"
	}
	password := os.Getenv("BPVP_SEED_PASSWORD")
	if password == "" {
		fmt.Fprintln(os.Stderr, "error: BPVP_SEED_PASSWORD is required")
		os.Exit(1)
	}
	role := os.Getenv("BPVP_SEED_ROLE")
	if role == "" {
		role = auth.RoleTrader
	}
	role = auth.NormalizeRole(role)

	hash, err := auth.HashPassword(password)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: hash password: %v\n", err)
		os.Exit(1)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: open db: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	const bootstrapUsers = `
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  totp_secret TEXT
);`
	if _, err := db.ExecContext(ctx, bootstrapUsers); err != nil {
		fmt.Fprintf(os.Stderr, "error: ensure users table: %v\n", err)
		os.Exit(1)
	}

	const q = `
INSERT INTO users (username, password_hash, role, totp_secret)
VALUES ($1, $2, $3, NULL)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  totp_secret = NULL`

	if _, err := db.ExecContext(ctx, q, username, hash, role); err != nil {
		fmt.Fprintf(os.Stderr, "error: upsert user: %v\n", err)
		fmt.Fprintln(os.Stderr, "hint: ensure the auth service has run once so table users exists, or create schema manually.")
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "ok: user %q role %q upserted (password updated if existed).\n", username, role)
	if role == auth.RoleAdmin {
		fmt.Fprintln(os.Stdout, "note: admin login requires TOTP — use /auth/totp setup flow or seed a non-admin role for password-only dev.")
	}
}
