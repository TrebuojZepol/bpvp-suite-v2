package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config holds runtime configuration validated at startup.
type Config struct {
	AuthPrivateKeyPEM   string
	AuthPublicKeyPEM    string
	DatabaseURL         string
	RedisURL            string
	AdminStepUpToken    string
	JWTExpiry           time.Duration
	RefreshTokenTTL     time.Duration
	RateLimitRequests   int
	RateLimitWindow     time.Duration
	HTTPAddr            string
}

const (
	defaultJWTExpiry         = 8 * time.Hour
	defaultRefreshTTL        = 168 * time.Hour
	defaultRateLimitRequests = 100
	defaultRateLimitWindow   = time.Minute
	defaultHTTPAddr          = ":8080"
)

// Load reads configuration from environment (via Viper) and validates required fields.
func Load() (*Config, error) {
	v := viper.New()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Defaults (safe)
	v.SetDefault("jwt_expiry", defaultJWTExpiry.String())
	v.SetDefault("refresh_token_ttl", defaultRefreshTTL.String())
	v.SetDefault("rate_limit_requests", defaultRateLimitRequests)
	v.SetDefault("rate_limit_window", defaultRateLimitWindow.String())
	v.SetDefault("http_addr", defaultHTTPAddr)

	_ = v.BindEnv("jwt_expiry", "BPVP_JWT_EXPIRY")
	_ = v.BindEnv("refresh_token_ttl", "BPVP_REFRESH_TOKEN_TTL")
	_ = v.BindEnv("rate_limit_requests", "BPVP_RATE_LIMIT_REQUESTS")
	_ = v.BindEnv("rate_limit_window", "BPVP_RATE_LIMIT_WINDOW")
	_ = v.BindEnv("http_addr", "BPVP_HTTP_ADDR")

	cfg := &Config{
		HTTPAddr: v.GetString("http_addr"),
	}

	jwtExpStr := v.GetString("jwt_expiry")
	d, err := time.ParseDuration(jwtExpStr)
	if err != nil {
		return nil, fmt.Errorf("BPVP_JWT_EXPIRY: invalid duration %q: %w", jwtExpStr, err)
	}
	cfg.JWTExpiry = d

	refStr := v.GetString("refresh_token_ttl")
	rt, err := time.ParseDuration(refStr)
	if err != nil {
		return nil, fmt.Errorf("BPVP_REFRESH_TOKEN_TTL: invalid duration %q: %w", refStr, err)
	}
	cfg.RefreshTokenTTL = rt
	if cfg.RefreshTokenTTL <= 0 {
		return nil, errors.New("BPVP_REFRESH_TOKEN_TTL must be positive")
	}

	cfg.RateLimitRequests = v.GetInt("rate_limit_requests")
	if cfg.RateLimitRequests <= 0 {
		return nil, errors.New("BPVP_RATE_LIMIT_REQUESTS must be positive")
	}

	rlw := v.GetString("rate_limit_window")
	w, err := time.ParseDuration(rlw)
	if err != nil {
		return nil, fmt.Errorf("BPVP_RATE_LIMIT_WINDOW: invalid duration %q: %w", rlw, err)
	}
	cfg.RateLimitWindow = w

	cfg.DatabaseURL = strings.TrimSpace(os.Getenv("BPVP_DATABASE_URL"))
	if cfg.DatabaseURL == "" {
		return nil, errors.New("required env BPVP_DATABASE_URL is missing")
	}

	cfg.RedisURL = strings.TrimSpace(os.Getenv("BPVP_REDIS_URL"))
	if cfg.RedisURL == "" {
		return nil, errors.New("required env BPVP_REDIS_URL is missing")
	}

	cfg.AdminStepUpToken = strings.TrimSpace(os.Getenv("BPVP_ADMIN_STEPUP_TOKEN"))
	if cfg.AdminStepUpToken == "" {
		return nil, errors.New("required env BPVP_ADMIN_STEPUP_TOKEN is missing")
	}

	privPEM, err := loadPEM(
		os.Getenv("BPVP_AUTH_PRIVATE_KEY_PEM"),
		os.Getenv("BPVP_AUTH_PRIVATE_KEY_FILE"),
		"BPVP_AUTH_PRIVATE_KEY_PEM",
		"BPVP_AUTH_PRIVATE_KEY_FILE",
	)
	if err != nil {
		return nil, err
	}
	cfg.AuthPrivateKeyPEM = privPEM

	pubPEM, err := loadPEM(
		os.Getenv("BPVP_AUTH_PUBLIC_KEY_PEM"),
		os.Getenv("BPVP_AUTH_PUBLIC_KEY_FILE"),
		"BPVP_AUTH_PUBLIC_KEY_PEM",
		"BPVP_AUTH_PUBLIC_KEY_FILE",
	)
	if err != nil {
		return nil, err
	}
	cfg.AuthPublicKeyPEM = pubPEM

	return cfg, nil
}

func loadPEM(inline, filePath, inlineName, fileName string) (string, error) {
	inline = strings.TrimSpace(inline)
	filePath = strings.TrimSpace(filePath)

	switch {
	case inline != "" && filePath != "":
		return "", fmt.Errorf("set only one of %s or %s", inlineName, fileName)
	case inline != "":
		if !strings.Contains(inline, "BEGIN") {
			return "", fmt.Errorf("%s does not look like PEM", inlineName)
		}
		return inline, nil
	case filePath != "":
		b, err := os.ReadFile(filePath)
		if err != nil {
			return "", fmt.Errorf("read %s: %w", fileName, err)
		}
		s := strings.TrimSpace(string(b))
		if !strings.Contains(s, "BEGIN") {
			return "", fmt.Errorf("%s does not contain PEM", fileName)
		}
		return s, nil
	default:
		return "", fmt.Errorf("required: %s or %s", inlineName, fileName)
	}
}
