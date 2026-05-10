package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	challengeTokenTTL = 15 * time.Minute
	tokenAudience       = "bpvp-engine"
)

// Claims wraps registered JWT claims with BPVP fields.
type Claims struct {
	Role string `json:"role"`
	MFA  bool   `json:"mfa"`
	jwt.RegisteredClaims
}

// Issuer signs and verifies RS256 JWTs and exposes JWKS for the public key.
type Issuer struct {
	priv      *rsa.PrivateKey
	pub       *rsa.PublicKey
	kid       string
	accessTTL time.Duration
}

// NewIssuerFromPEM parses RSA keys from PEM blocks and constructs an Issuer.
func NewIssuerFromPEM(privatePEM, publicPEM string, accessTTL time.Duration) (*Issuer, error) {
	priv, err := parseRSAPrivateKey([]byte(privatePEM))
	if err != nil {
		return nil, fmt.Errorf("private key: %w", err)
	}
	pub, err := parseRSAPublicKey([]byte(publicPEM))
	if err != nil {
		return nil, fmt.Errorf("public key: %w", err)
	}
	if priv.PublicKey.E != pub.E || priv.PublicKey.N.Cmp(pub.N) != 0 {
		return nil, errors.New("public key does not match private key")
	}
	kid, err := computeKeyID(pub)
	if err != nil {
		return nil, err
	}
	if accessTTL <= 0 {
		return nil, errors.New("access TTL must be positive")
	}
	return &Issuer{
		priv:      priv,
		pub:       pub,
		kid:       kid,
		accessTTL: accessTTL,
	}, nil
}

// KeyID returns the stable identifier used in JWT headers and JWKS.
func (i *Issuer) KeyID() string {
	return i.kid
}

// IssueAccessToken mints an RS256 JWT with an 8-hour TTL unless ttl overrides (cfg default passed from caller).
func (i *Issuer) IssueAccessToken(username, role string, mfa bool, ttl time.Duration) (string, error) {
	if ttl <= 0 {
		ttl = i.accessTTL
	}
	return i.issue(username, role, mfa, ttl)
}

// IssueChallengeToken mints a short-lived JWT (15 minutes) for wallet / step-up flows.
func (i *Issuer) IssueChallengeToken(username string) (string, error) {
	return i.issue(username, RoleViewer, false, challengeTokenTTL)
}

func (i *Issuer) issue(username, role string, mfa bool, ttl time.Duration) (string, error) {
	if username == "" {
		return "", errors.New("subject required")
	}
	role = NormalizeRole(role)
	now := time.Now().UTC()
	jti := make([]byte, 16)
	if _, err := rand.Read(jti); err != nil {
		return "", fmt.Errorf("jti: %w", err)
	}
	claims := Claims{
		Role: role,
		MFA:  mfa,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   username,
			Audience:  jwt.ClaimStrings{tokenAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			NotBefore: jwt.NewNumericDate(now.Add(-30 * time.Second)),
			ID:        hex.EncodeToString(jti),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tok.Header["kid"] = i.kid
	return tok.SignedString(i.priv)
}

// VerifyAccessToken parses and validates an access JWT using the configured public key.
func (i *Issuer) VerifyAccessToken(token string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(
		token,
		&Claims{},
		func(t *jwt.Token) (any, error) {
			if t.Method.Alg() != jwt.SigningMethodRS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return i.pub, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Alg()}),
		jwt.WithAudience(tokenAudience),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}
	c, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token claims")
	}
	return c, nil
}

// JWKSJSON returns the JSON JWKS document for /.well-known/jwks.json.
func (i *Issuer) JWKSJSON() ([]byte, error) {
	n := encodeBigIntURL(i.pub.N)
	e := encodeIntURL(i.pub.E)
	doc := map[string]any{
		"keys": []map[string]any{
			{
				"kty": "RSA",
				"kid": i.kid,
				"use": "sig",
				"alg": jwt.SigningMethodRS256.Alg(),
				"n":   n,
				"e":   e,
			},
		},
	}
	return json.Marshal(doc)
}

func parseRSAPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	switch block.Type {
	case "RSA PRIVATE KEY":
		return x509.ParsePKCS1PrivateKey(block.Bytes)
	case "PRIVATE KEY":
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, err
		}
		priv, ok := key.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("PKCS8 key is not RSA")
		}
		return priv, nil
	default:
		return nil, fmt.Errorf("unsupported PEM type %s", block.Type)
	}
}

func parseRSAPublicKey(pemBytes []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	switch block.Type {
	case "RSA PUBLIC KEY":
		return x509.ParsePKCS1PublicKey(block.Bytes)
	case "PUBLIC KEY":
		key, err := x509.ParsePKIXPublicKey(block.Bytes)
		if err != nil {
			return nil, err
		}
		pub, ok := key.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("PUBLIC KEY is not RSA")
		}
		return pub, nil
	default:
		return nil, fmt.Errorf("unsupported PEM type %s", block.Type)
	}
}

func computeKeyID(pub *rsa.PublicKey) (string, error) {
	spki, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(spki)
	return hex.EncodeToString(sum[:8]), nil
}

func encodeBigIntURL(n *big.Int) string {
	return base64.RawURLEncoding.EncodeToString(n.Bytes())
}

func encodeIntURL(e int) string {
	b := big.NewInt(int64(e)).Bytes()
	return base64.RawURLEncoding.EncodeToString(b)
}
