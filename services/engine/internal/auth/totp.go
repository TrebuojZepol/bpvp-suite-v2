package auth

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

const totpIssuer = "BPVP"

// GenerateTOTPSecret creates a 20-byte random secret encoded in Base32 (no padding).
func GenerateTOTPSecret() (string, error) {
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("random secret: %w", err)
	}
	enc := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(raw)
	return enc, nil
}

// TOTPProvisionURI builds an otpauth URI for authenticator apps.
func TOTPProvisionURI(username, secret string) string {
	label := fmt.Sprintf("%s:%s", totpIssuer, username)
	q := url.Values{}
	q.Set("secret", secret)
	q.Set("issuer", totpIssuer)
	return fmt.Sprintf("otpauth://totp/%s?%s", url.PathEscape(label), q.Encode())
}

// VerifyTOTP validates a passcode with ±1 step window (30-second steps per RFC 6238).
func VerifyTOTP(secret, passcode string, t time.Time) bool {
	secret = strings.TrimSpace(secret)
	passcode = strings.TrimSpace(passcode)
	if secret == "" || passcode == "" {
		return false
	}
	ok, err := totp.ValidateCustom(
		passcode,
		secret,
		t,
		totp.ValidateOpts{
			Period:    30,
			Skew:      1,
			Digits:    otp.DigitsSix,
			Algorithm: otp.AlgorithmSHA1,
		},
	)
	return err == nil && ok
}

// AdminRequiresTOTP reports whether admin accounts must enroll MFA (per product rules).
func AdminRequiresTOTP() bool {
	return true
}
