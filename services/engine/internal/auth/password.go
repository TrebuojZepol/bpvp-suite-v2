package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonTime      = 3
	argonMemoryKiB = 64 * 1024 // 64 MiB
	argonThreads   = 4
	saltLength     = 16
	keyLength      = 32
)

// ErrWeakPassword is returned when the password is empty.
var ErrWeakPassword = errors.New("password must not be empty")

// HashPassword returns a PHC-style encoded Argon2id hash (no plaintext stored).
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", ErrWeakPassword
	}
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("salt: %w", err)
	}
	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemoryKiB, argonThreads, keyLength)
	// Format: $argon2id$v=19$m=65536,t=3,p=4$base64(salt)$base64(hash)
	enc := fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argonMemoryKiB,
		argonTime,
		argonThreads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	)
	return enc, nil
}

// VerifyPassword checks a password against an encoded Argon2id hash using constant-time comparison.
func VerifyPassword(password, encoded string) bool {
	if encoded == "" || password == "" {
		return false
	}
	salt, expected, ok := decodePHC(encoded)
	if !ok {
		return false
	}
	calc := argon2.IDKey([]byte(password), salt, argonTime, argonMemoryKiB, argonThreads, keyLength)
	return subtle.ConstantTimeCompare(calc, expected) == 1
}

func decodePHC(encoded string) (salt, hash []byte, ok bool) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return nil, nil, false
	}
	var mem, time uint64
	var threads uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &mem, &time, &threads); err != nil {
		return nil, nil, false
	}
	if mem != argonMemoryKiB || time != argonTime || threads != argonThreads {
		return nil, nil, false
	}
	var err error
	salt, err = base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil || len(salt) != saltLength {
		return nil, nil, false
	}
	hash, err = base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil || len(hash) != keyLength {
		return nil, nil, false
	}
	return salt, hash, true
}

// ParsePHCParams extracts recorded Argon2 parameters for tests / interoperability (exported for verification helpers).
func ParsePHCParams(encoded string) (memoryKiB uint32, iterations uint32, parallelism uint8, ok bool) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 {
		return 0, 0, 0, false
	}
	var mem, iter uint64
	var par uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &mem, &iter, &par); err != nil {
		return 0, 0, 0, false
	}
	return uint32(mem), uint32(iter), par, true
}

// SaltLen returns the configured salt length (exported for tests).
func SaltLen() int {
	return saltLength
}

// KeyLen returns the configured derived key length (exported for tests).
func KeyLen() int {
	return keyLength
}

// ArgonParams exports tuning constants for tests.
func ArgonParams() (memoryKiB uint32, iterations uint32, parallelism uint8) {
	return argonMemoryKiB, argonTime, argonThreads
}
