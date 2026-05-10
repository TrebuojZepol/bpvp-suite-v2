package main

import (
	"context"
	"database/sql"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/bpvp-suite-v2/services/engine/internal/auth"
	"github.com/bpvp-suite-v2/services/engine/internal/config"
)

const bootstrapSchema = `
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  token_hash BYTEA NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_username_idx ON refresh_tokens(username);
`

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		panic(err)
	}
	defer func() { _ = logger.Sync() }()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("config", zap.Error(err))
	}

	issuer, err := auth.NewIssuerFromPEM(cfg.AuthPrivateKeyPEM, cfg.AuthPublicKeyPEM, cfg.JWTExpiry)
	if err != nil {
		logger.Fatal("jwt issuer", zap.Error(err))
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database open", zap.Error(err))
	}
	defer db.Close()
	db.SetMaxOpenConns(16)
	db.SetMaxIdleConns(8)
	db.SetConnMaxLifetime(30 * time.Minute)

	schemaCtx, schemaCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer schemaCancel()
	if _, err := db.ExecContext(schemaCtx, bootstrapSchema); err != nil {
		logger.Fatal("schema", zap.Error(err))
	}

	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		logger.Fatal("redis url", zap.Error(err))
	}
	rdb := redis.NewClient(opt)
	defer func() { _ = rdb.Close() }()
	pingCtx, pingCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer pingCancel()
	if err := rdb.Ping(pingCtx).Err(); err != nil {
		logger.Fatal("redis", zap.Error(err))
	}

	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		c.Next()
		logger.Info("http",
			zap.String("method", method),
			zap.String("path", path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
		)
	})

	ipLim := &auth.RedisRateLimiter{
		RDB:     rdb,
		Limit:   cfg.RateLimitRequests,
		Window:  cfg.RateLimitWindow,
		KeyPref: "rl:ip",
	}
	userLim := &auth.RedisRateLimiter{
		RDB:     rdb,
		Limit:   cfg.RateLimitRequests,
		Window:  cfg.RateLimitWindow,
		KeyPref: "rl:user",
	}
	engine.Use(auth.IPRateLimitMiddleware(ipLim))

	api := &auth.API{
		DB:         db,
		Issuer:     issuer,
		Challenges: &auth.ChallengeService{RDB: rdb},
		Refresh:    &auth.RefreshTokenStore{DB: db},
		RefreshTTL: cfg.RefreshTokenTTL,
		AccessTTL:  cfg.JWTExpiry,
	}
	api.RegisterRoutes(engine, userLim)

	srvErr := make(chan error, 1)
	go func() {
		srvErr <- engine.Run(cfg.HTTPAddr)
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-sig:
		logger.Info("shutdown signal")
	case err := <-srvErr:
		if err != nil {
			logger.Fatal("http", zap.Error(err))
		}
	}
}
