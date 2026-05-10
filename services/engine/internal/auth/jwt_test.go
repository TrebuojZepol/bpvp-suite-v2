package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func rsaPEMPair(t *testing.T) (privPEM, pubPEM string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)

	privBlk := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	}
	pubBlk := &pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: x509.MarshalPKCS1PublicKey(&key.PublicKey),
	}
	return string(pem.EncodeToMemory(privBlk)), string(pem.EncodeToMemory(pubBlk))
}

func TestIssuerJWKSAndTokens(t *testing.T) {
	privPEM, pubPEM := rsaPEMPair(t)
	iss, err := NewIssuerFromPEM(privPEM, pubPEM, time.Hour)
	require.NoError(t, err)
	require.NotEmpty(t, iss.KeyID())

	at, err := iss.IssueAccessToken("bob", RoleTrader, true, time.Hour)
	require.NoError(t, err)
	cl, err := iss.VerifyAccessToken(at)
	require.NoError(t, err)
	require.Equal(t, "bob", cl.Subject)
	require.Equal(t, RoleTrader, cl.Role)
	require.True(t, cl.MFA)

	ct, err := iss.IssueChallengeToken("bob")
	require.NoError(t, err)
	cl2, err := iss.VerifyAccessToken(ct)
	require.NoError(t, err)
	require.Equal(t, "bob", cl2.Subject)

	jwks, err := iss.JWKSJSON()
	require.NoError(t, err)
	require.Contains(t, string(jwks), `"keys"`)
	require.Contains(t, string(jwks), iss.KeyID())
}

func TestIssuer_KeyMismatch(t *testing.T) {
	privPEM, _ := rsaPEMPair(t)
	key2, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	pubWrong := string(pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: x509.MarshalPKCS1PublicKey(&key2.PublicKey),
	}))
	_, err = NewIssuerFromPEM(privPEM, pubWrong, time.Hour)
	require.Error(t, err)
}
