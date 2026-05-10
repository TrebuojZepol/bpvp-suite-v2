package auth

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNormalizeRole(t *testing.T) {
	require.Equal(t, RoleAdmin, NormalizeRole("ADMIN"))
	require.Equal(t, RoleViewer, NormalizeRole("unknown"))
	require.Equal(t, RoleTrader, NormalizeRole("trader"))
}

func TestCanAccess(t *testing.T) {
	require.True(t, CanAccess([]string{RoleTrader}, []string{}))
	require.True(t, CanAccess([]string{RoleTrader}, []string{RoleTrader}))
	require.False(t, CanAccess([]string{RoleViewer}, []string{RoleAdmin}))
	require.True(t, CanAccess([]string{RoleAdmin}, []string{RoleAdmin, RoleTrader}))
}

func TestStepUpRequired(t *testing.T) {
	require.True(t, StepUpRequired("withdraw"))
	require.True(t, StepUpRequired("WITHDRAW"))
	require.False(t, StepUpRequired("read"))
}
