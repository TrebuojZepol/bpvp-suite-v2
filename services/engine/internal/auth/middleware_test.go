package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func TestAuthMiddlewareAndRBAC(t *testing.T) {
	gin.SetMode(gin.TestMode)

	privPEM, pubPEM := rsaPEMPair(t)
	iss, err := NewIssuerFromPEM(privPEM, pubPEM, time.Hour)
	require.NoError(t, err)

	tok, err := iss.IssueAccessToken("ada", RoleTrader, false, time.Hour)
	require.NoError(t, err)

	r := gin.New()
	r.Use(AuthMiddleware(iss))
	r.GET("/x", RBACMiddleware([]string{RoleTrader}), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set(HeaderAuthorization, "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	req2 := httptest.NewRequest(http.MethodGet, "/x", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	require.Equal(t, http.StatusUnauthorized, w2.Code)
}

func TestStepUpMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(StepUpMiddleware("secret-token"))
	r.GET("/y", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/y", nil)
	req.Header.Set(HeaderStepUp, "secret-token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestIPRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	lim := &RedisRateLimiter{}
	r.Use(IPRateLimitMiddleware(lim))
	r.GET("/z", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/z", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestUserRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	srv, err := miniredis.Run()
	require.NoError(t, err)
	defer srv.Close()
	rdb := redis.NewClient(&redis.Options{Addr: srv.Addr()})
	defer func() { _ = rdb.Close() }()

	privPEM, pubPEM := rsaPEMPair(t)
	iss, err := NewIssuerFromPEM(privPEM, pubPEM, time.Hour)
	require.NoError(t, err)
	tok, err := iss.IssueAccessToken("bob", RoleViewer, false, time.Hour)
	require.NoError(t, err)

	userLim := &RedisRateLimiter{RDB: rdb, Limit: 1, Window: time.Minute, KeyPref: "utest"}

	r := gin.New()
	r.Use(AuthMiddleware(iss))
	r.Use(UserRateLimitMiddleware(userLim))
	r.GET("/u", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/u", nil)
	req.Header.Set(HeaderAuthorization, "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	req2 := httptest.NewRequest(http.MethodGet, "/u", nil)
	req2.Header.Set(HeaderAuthorization, "Bearer "+tok)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	require.Equal(t, http.StatusTooManyRequests, w2.Code)
}
