package auth

import (
	"strings"
)

// Canonical platform roles.
const (
	RoleAdmin    = "admin"
	RoleTrader   = "trader"
	RoleRisk     = "risk"
	RoleOperator = "operator"
	RoleViewer   = "viewer"
)

// CanAccess returns true if any session role matches an allowed role (after normalization).
func CanAccess(sessionRoles []string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}
	for _, sr := range sessionRoles {
		u := NormalizeRole(sr)
		for _, a := range allowed {
			if u == NormalizeRole(a) {
				return true
			}
		}
	}
	return false
}

// NormalizeRole lowercases and trims; unknown values fall back to viewer.
func NormalizeRole(role string) string {
	r := strings.ToLower(strings.TrimSpace(role))
	switch r {
	case RoleAdmin, RoleTrader, RoleRisk, RoleOperator, RoleViewer:
		return r
	default:
		return RoleViewer
	}
}

// StepUpRequired marks privileged actions that require an additional step-up token header.
func StepUpRequired(action string) bool {
	a := strings.ToLower(strings.TrimSpace(action))
	switch a {
	case "withdraw", "pause-trading", "rotate-keys", "policy-change", "user-delete", "sudo":
		return true
	default:
		return false
	}
}
