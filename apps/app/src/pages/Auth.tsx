import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Sign-in form component that handles the two-step OTP flow.
 * Only rendered when user is unauthenticated.
 */
function SignInForm() {
  const { signIn } = useAuthActions();
  const devPasswordEnabled = import.meta.env.VITE_ENABLE_DEV_PASSWORD_AUTH === "true";
  const devEmailDefault =
    import.meta.env.VITE_DEV_PASSWORD_AUTH_EMAIL || "test@example.local";
  const devPasswordDefault =
    import.meta.env.VITE_DEV_PASSWORD_AUTH_PASSWORD || "TestUser2026#Secure!";

  // Two-step flow: email input → OTP code input
  const [step, setStep] = useState<"email" | { email: string }>("email");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devEmail, setDevEmail] = useState(devEmailDefault);
  const [devPassword, setDevPassword] = useState(devPasswordDefault);
  const [devError, setDevError] = useState("");
  const [isDevSubmitting, setIsDevSubmitting] = useState(false);

  const buildPasswordParams = () => ({
    email: devEmail,
    password: devPassword,
  });

  const handleDevPasswordSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDevError("");
    setIsDevSubmitting(true);

    if (!devEmail || !devPassword) {
      setDevError("Email and password are required.");
      setIsDevSubmitting(false);
      return;
    }

    try {
      const result = await signIn("dev-password", buildPasswordParams());
      console.log("[Auth Debug] Dev password sign-in result:", result);
    } catch (err) {
      console.error("[Auth Debug] Dev password sign-in failed:", err);
      setDevError("Dev password sign-in failed. Check email/password.");
    } finally {
      setIsDevSubmitting(false);
    }
  };

  // Handle email submission - sends OTP
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      console.log("[Auth Debug] Sending OTP to:", email);
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Sending OTP",
        level: "info",
        data: { email },
      });

      // Call signIn with FormData to trigger OTP send
      await signIn("resend-otp", formData);

      // If signIn returns without error, OTP was sent
      console.log("[Auth Debug] OTP sent successfully");
      setStep({ email });
    } catch (err) {
      console.error("[Auth Debug] Failed to send OTP:", err);
      Sentry.captureException(err, {
        extra: { email, step: "send-otp" },
      });
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP code submission - verifies and signs in
  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      console.log("[Auth Debug] Verifying OTP code");
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Verifying OTP",
        level: "info",
      });

      // Call signIn with FormData containing email and code
      const result = await signIn("resend-otp", formData);

      console.log("[Auth Debug] OTP verification result:", result);

      // The Authenticated component will handle redirect
      // when auth state updates
    } catch (err) {
      console.error("[Auth Debug] Failed to verify OTP:", err);
      Sentry.captureException(err, {
        extra: { step: "verify-otp" },
      });
      setError("Invalid or expired code. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Email input step
  if (step === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="text-muted-foreground">
              Enter your email to receive a verification code.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending code..." : "Continue with Email"}
            </Button>
          </form>
          {devPasswordEnabled && (
            <div className="border-t pt-4 space-y-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Dev Password Sign-in
              </div>
              <form onSubmit={handleDevPasswordSignIn} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dev-email">Email</Label>
                  <Input
                    id="dev-email"
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    disabled={isDevSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dev-password">Password</Label>
                  <Input
                    id="dev-password"
                    type="password"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    disabled={isDevSubmitting}
                  />
                </div>
                {devError && (
                  <p className="text-sm text-destructive">{devError}</p>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={isDevSubmitting}
                >
                  {isDevSubmitting ? "Signing in..." : "Sign in with Password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // OTP code input step
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Enter verification code</h1>
          <p className="text-muted-foreground">
            We sent a code to <span className="font-medium">{step.email}</span>
          </p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <input type="hidden" name="email" value={step.email} />
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              placeholder="12345678"
              required
              autoFocus
              autoComplete="one-time-code"
              disabled={isSubmitting}
              className="text-center text-xl tracking-widest font-mono"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 8-digit code from your email
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep("email");
              setError("");
            }}
            disabled={isSubmitting}
          >
            Use a different email
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Component that redirects authenticated users to their destination.
 * Only rendered when user is authenticated.
 */
function AuthenticatedRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  useEffect(() => {
    console.log("[Auth Debug] User authenticated, redirecting to:", from);
    Sentry.addBreadcrumb({
      category: "auth",
      message: "Authenticated, redirecting",
      level: "info",
      data: { returnTo: from },
    });
    navigate(from, { replace: true });
  }, [navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

/**
 * Auth page that uses Convex Auth's recommended Authenticated/Unauthenticated
 * components for proper state management.
 */
export default function Auth() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </>
  );
}
