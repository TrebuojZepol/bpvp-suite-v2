package auth

import (
	"testing"
	"time"

	"github.com/pquerna/otp/totp"
	"github.com/stretchr/testify/require"
)

func TestGenerateTOTPSecretAndProvisionURI(t *testing.T) {
	sec, err := GenerateTOTPSecret()
	require.NoError(t, err)
	require.NotEmpty(t, sec)

	uri := TOTPProvisionURI("alice", sec)
	require.Contains(t, uri, "otpauth://totp/")
	require.Contains(t, uri, "secret=")
	require.Contains(t, uri, "issuer=BPVP")

	code, err := totp.GenerateCode(sec, time.Now())
	require.NoError(t, err)
	require.True(t, VerifyTOTP(sec, code, time.Now()))

	require.True(t, AdminRequiresTOTP())
}

func TestVerifyTOTP_Window(t *testing.T) {
	sec, err := GenerateTOTPSecret()
	require.NoError(t, err)
	ts := time.Now().UTC().Add(-30 * time.Second)
	code, err := totp.GenerateCode(sec, ts)
	require.NoError(t, err)
	require.True(t, VerifyTOTP(sec, code, time.Now()))
}
