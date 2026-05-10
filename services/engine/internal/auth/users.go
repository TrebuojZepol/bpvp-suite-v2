package auth

import (
	"context"
	"database/sql"
	"errors"
)

// UserRecord represents stored credentials for authentication (no secrets logged).
type UserRecord struct {
	Username     string
	PasswordHash string
	Role         string
	TOTPSecret   sql.NullString
}

// ErrUserNotFound indicates the username does not exist.
var ErrUserNotFound = errors.New("user not found")

// LoadUser fetches a user row by primary key.
func LoadUser(ctx context.Context, db *sql.DB, username string) (*UserRecord, error) {
	if db == nil {
		return nil, errors.New("database required")
	}
	row := db.QueryRowContext(ctx,
		`SELECT username, password_hash, role, totp_secret FROM users WHERE username=$1`,
		username,
	)
	var u UserRecord
	if err := row.Scan(&u.Username, &u.PasswordHash, &u.Role, &u.TOTPSecret); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}
