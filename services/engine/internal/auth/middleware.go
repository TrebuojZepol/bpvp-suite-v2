package auth

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	// HeaderAuthorization is the standard OAuth2 bearer header.
	HeaderAuthorization = "Authorization"
	// HeaderStepUp carries the operator step-up token for sensitive routes.
	HeaderStepUp = "X-BPVP-Step-Up-Token"
)

type ginCtxKey string

const claimsContextKey ginCtxKey = "bpvp.auth.claims"

// AuthMiddleware validates Bearer JWTs and stores claims in Gin context.
func AuthMiddleware(issuer *Issuer) gin.HandlerFunc {
	return func(c *gin.Context) {
		if issuer == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "issuer not configured"})
			return
		}
		raw := strings.TrimSpace(c.GetHeader(HeaderAuthorization))
		if len(raw) < 7 || strings.ToLower(raw[:7]) != "bearer " {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tok := strings.TrimSpace(raw[7:])
		if tok == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		claims, err := issuer.VerifyAccessToken(tok)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(string(claimsContextKey), claims)
		c.Next()
	}
}

// ClaimsFromContext returns JWT claims previously injected by AuthMiddleware.
func ClaimsFromContext(c *gin.Context) (*Claims, bool) {
	v, ok := c.Get(string(claimsContextKey))
	if !ok {
		return nil, false
	}
	cl, ok := v.(*Claims)
	return cl, ok
}

// RBACMiddleware enforces role membership using CanAccess.
func RBACMiddleware(allowed []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cl, ok := ClaimsFromContext(c)
		if !ok || cl == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if !CanAccess([]string{cl.Role}, allowed) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

// StepUpMiddleware validates the admin step-up shared secret using constant-time comparison.
func StepUpMiddleware(adminToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if adminToken == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "step-up not configured"})
			return
		}
		got := strings.TrimSpace(c.GetHeader(HeaderStepUp))
		if len(got) != len(adminToken) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "step-up required"})
			return
		}
		if subtle.ConstantTimeCompare([]byte(got), []byte(adminToken)) != 1 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "step-up required"})
			return
		}
		c.Next()
	}
}

// IPRateLimitMiddleware applies a Redis-backed fixed window counter per client IP.
func IPRateLimitMiddleware(limiter *RedisRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		if ok, err := limiter.Allow(ctx, c.ClientIP()); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "rate limit backend"})
			return
		} else if !ok {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit"})
			return
		}
		c.Next()
	}
}

// UserRateLimitMiddleware applies an additional counter per authenticated subject (must run after AuthMiddleware).
func UserRateLimitMiddleware(limiter *RedisRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		cl, ok := ClaimsFromContext(c)
		if !ok || cl == nil || cl.Subject == "" {
			c.Next()
			return
		}
		if ok, err := limiter.Allow(c.Request.Context(), cl.Subject); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "rate limit backend"})
			return
		} else if !ok {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit"})
			return
		}
		c.Next()
	}
}
