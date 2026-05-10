package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/require"
)

func TestIssueRefreshToken(t *testing.T) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	require.NoError(t, err)
	defer func() { _ = db.Close() }()

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM refresh_tokens WHERE username=\$1`).
		WithArgs("u1").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`INSERT INTO refresh_tokens \(username, token_hash, expires_at\) VALUES \(\$1, \$2, \$3\)`).
		WithArgs("u1", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	store := &RefreshTokenStore{DB: db}
	plain, err := store.IssueRefreshToken(context.Background(), "u1", time.Hour)
	require.NoError(t, err)
	require.Len(t, plain, 64)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestRotateRefreshToken(t *testing.T) {
	plain := hex.EncodeToString(make([]byte, 32))
	sum := sha256.Sum256([]byte(plain))

	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	require.NoError(t, err)
	defer func() { _ = db.Close() }()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT username, expires_at FROM refresh_tokens WHERE token_hash=\$1 FOR UPDATE`).
		WithArgs(sum[:]).
		WillReturnRows(sqlmock.NewRows([]string{"username", "expires_at"}).AddRow("u1", time.Now().UTC().Add(time.Hour)))
	mock.ExpectExec(`DELETE FROM refresh_tokens WHERE token_hash=\$1`).
		WithArgs(sum[:]).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`INSERT INTO refresh_tokens \(username, token_hash, expires_at\) VALUES \(\$1, \$2, \$3\)`).
		WithArgs("u1", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	store := &RefreshTokenStore{DB: db}
	user, newPlain, err := store.RotateRefreshToken(context.Background(), plain, time.Hour)
	require.NoError(t, err)
	require.Equal(t, "u1", user)
	require.NotEqual(t, plain, newPlain)
	require.NoError(t, mock.ExpectationsWereMet())
}
