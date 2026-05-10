package auth

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestHashPasswordVerifyPassword(t *testing.T) {
	mem, it, par := ArgonParams()
	require.Equal(t, uint32(64*1024), mem)
	require.Equal(t, uint32(3), it)
	require.Equal(t, uint8(4), par)
	require.Equal(t, 16, SaltLen())
	require.Equal(t, 32, KeyLen())

	h, err := HashPassword("correct horse battery staple")
	require.NoError(t, err)
	require.True(t, VerifyPassword("correct horse battery staple", h))
	require.False(t, VerifyPassword("wrong", h))

	mem2, _, _, ok := ParsePHCParams(h)
	require.True(t, ok)
	require.Equal(t, mem, mem2)

	_, err = HashPassword("")
	require.ErrorIs(t, err, ErrWeakPassword)
	require.False(t, VerifyPassword("x", ""))
}

func TestVerifyPassword_InvalidEncoding(t *testing.T) {
	require.False(t, VerifyPassword("pw", "not-a-hash"))
}
