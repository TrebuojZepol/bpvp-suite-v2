package auth

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// API bundles HTTP dependencies for the auth surface.
type API struct {
	DB         *sql.DB
	Issuer     *Issuer
	Challenges *ChallengeService
	Refresh    *RefreshTokenStore
	RefreshTTL time.Duration
	AccessTTL  time.Duration
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	TOTP     string `json:"totp,omitempty"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// RegisterRoutes mounts HTTP handlers on the Gin engine.
func (a *API) RegisterRoutes(r *gin.Engine, userLimiter *RedisRateLimiter) {
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/.well-known/jwks.json", func(c *gin.Context) {
		body, err := a.Issuer.JWKSJSON()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "jwks"})
			return
		}
		c.Data(http.StatusOK, "application/json", body)
	})

	r.POST("/auth/login", a.handleLogin)
	r.POST("/auth/refresh", a.handleRefresh)

	r.POST("/auth/challenge", func(c *gin.Context) {
		var body struct {
			Username string `json:"username"`
		}
		if err := c.ShouldBindJSON(&body); err != nil || body.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
			return
		}
		ch, err := a.Challenges.IssueChallenge(c.Request.Context(), body.Username)
		if err != nil {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "challenge unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"nonce": ch.Nonce, "expires_at": ch.ExpiresAt.UTC().Format(time.RFC3339)})
	})

	protected := r.Group("/")
	protected.Use(AuthMiddleware(a.Issuer))
	if userLimiter != nil {
		protected.Use(UserRateLimitMiddleware(userLimiter))
	}
	protected.GET("/auth/me", RBACMiddleware([]string{RoleViewer, RoleTrader, RoleRisk, RoleOperator, RoleAdmin}), func(c *gin.Context) {
		cl, ok := ClaimsFromContext(c)
		if !ok || cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"sub": cl.Subject, "role": cl.Role, "mfa": cl.MFA})
	})
}

func (a *API) handleLogin(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	ctx := c.Request.Context()
	u, err := LoadUser(ctx, a.DB, req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if !VerifyPassword(req.Password, u.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	role := NormalizeRole(u.Role)

	if role == RoleAdmin && AdminRequiresTOTP() {
		if !u.TOTPSecret.Valid || u.TOTPSecret.String == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin must enroll totp"})
			return
		}
		if !VerifyTOTP(u.TOTPSecret.String, req.TOTP, time.Now().UTC()) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "totp required"})
			return
		}
	} else if u.TOTPSecret.Valid && u.TOTPSecret.String != "" {
		if !VerifyTOTP(u.TOTPSecret.String, req.TOTP, time.Now().UTC()) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "totp required"})
			return
		}
	}

	mfa := u.TOTPSecret.Valid && u.TOTPSecret.String != ""
	access, err := a.Issuer.IssueAccessToken(u.Username, role, mfa, a.AccessTTL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token"})
		return
	}
	refresh, err := a.Refresh.IssueRefreshToken(ctx, u.Username, a.RefreshTTL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "refresh"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
		"token_type":    "Bearer",
		"expires_in":    int(a.AccessTTL.Seconds()),
	})
}

func (a *API) handleRefresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	ctx := c.Request.Context()
	user, newRefresh, err := a.Refresh.RotateRefreshToken(ctx, req.RefreshToken, a.RefreshTTL)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh"})
		return
	}
	u, err := LoadUser(ctx, a.DB, user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	role := NormalizeRole(u.Role)
	mfa := u.TOTPSecret.Valid && u.TOTPSecret.String != ""
	access, err := a.Issuer.IssueAccessToken(user, role, mfa, a.AccessTTL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"access_token":  access,
		"refresh_token": newRefresh,
		"token_type":    "Bearer",
		"expires_in":    int(a.AccessTTL.Seconds()),
	})
}
