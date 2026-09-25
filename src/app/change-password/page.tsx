"use client";

import { useState } from "react";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Eye toggle state for each field
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    setSubmitting(true);
    try {
      const { oldPassword: validOldPassword, newPassword: validNewPassword } =
        changePasswordSchema.parse({
          oldPassword,
          newPassword,
          confirmPassword,
        });
      const response = await authApi.changePassword({
        oldPassword: validOldPassword,
        newPassword: validNewPassword,
      });
      setSuccess(response.data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err?.issues && Array.isArray(err.issues)) {
        // Collect field-specific Zod validation errors
        const errors: Record<string, string> = {};
        for (const issue of err.issues) {
          const fieldName = issue.path?.[0];
          if (fieldName && !errors[fieldName]) {
            errors[fieldName] = issue.message;
          }
        }
        setFieldErrors(errors);
      } else {
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "Unable to change your password. Try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthenticatedShell>
      <div className="max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-ink">
          Change password
        </h1>
        <p className="mt-1 mb-8 text-sm text-ink/60">
          Use a strong new password with at least eight characters.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="oldPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              Current password
            </label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none"
                aria-label={showOldPassword ? "Hide password" : "Show password"}
              >
                {showOldPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.oldPassword && (
              <p className="mt-1 text-xs text-status-rejected">
                {fieldErrors.oldPassword}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              New password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="mt-1 text-xs text-status-rejected">
                {fieldErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-status-rejected">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-status-approved/30 bg-status-approved/10 px-3 py-2 text-sm text-ink">
              {success}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Updating password…" : "Update password"}
          </Button>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
