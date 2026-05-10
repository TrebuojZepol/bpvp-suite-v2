package config

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"testing"

	"github.com/stretchr/testify/require"
)

func rsaPairPEM(t *testing.T) (priv, pub string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	privBlk := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	pubBlk := pem.EncodeToMemory(&pem.Block{Type: "RSA PUBLIC KEY", Bytes: x509.MarshalPKCS1PublicKey(&key.PublicKey)})
	return string(privBlk), string(pubBlk)
}

func TestLoad(t *testing.T) {
	priv, pub := rsaPairPEM(t)

	t.Run("missing_database_url", func(t *testing.T) {
		t.Setenv("BPVP_DATABASE_URL", "")
		t.Setenv("BPVP_REDIS_URL", "redis://localhost:6379/0")
		t.Setenv("BPVP_ADMIN_STEPUP_TOKEN", "step-secret-token-here")
		t.Setenv("BPVP_AUTH_PRIVATE_KEY_PEM", priv)
		t.Setenv("BPVP_AUTH_PUBLIC_KEY_PEM", pub)
		_, err := Load()
		require.Error(t, err)
	})

	t.Run("ok", func(t *testing.T) {
		t.Setenv("BPVP_DATABASE_URL", "postgres://u:p@localhost:5432/db")
		t.Setenv("BPVP_REDIS_URL", "redis://localhost:6379/0")
		t.Setenv("BPVP_ADMIN_STEPUP_TOKEN", "step-secret-token-here")
		t.Setenv("BPVP_AUTH_PRIVATE_KEY_PEM", priv)
		t.Setenv("BPVP_AUTH_PUBLIC_KEY_PEM", pub)

		cfg, err := Load()
		require.NoError(t, err)
		require.NotZero(t, cfg.JWTExpiry)
		require.NotZero(t, cfg.RefreshTokenTTL)
	})
}
