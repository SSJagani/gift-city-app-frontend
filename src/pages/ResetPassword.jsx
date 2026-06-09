import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, Lock } from "lucide-react";
import { authApi } from "../api/http.js";
import AuthNotice from "../components/AuthNotice.jsx";
import FormField from "../components/FormField.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [form, setForm] = useState({ token: initialToken, newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const payload = await authApi.resetPassword(form.token, form.newPassword);
      setMessage(payload.message || "Your password has been reset.");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h2>Set new password</h2>
        <p>Use the token from your reset email.</p>
      </div>
      <AuthNotice>{error}</AuthNotice>
      <AuthNotice type="success">{message}</AuthNotice>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          icon={KeyRound}
          label="Reset token"
          name="token"
          value={form.token}
          onChange={updateField}
          placeholder="Paste reset token"
          autoComplete="one-time-code"
        />
        <FormField
          icon={Lock}
          label="New password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={updateField}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          minLength={8}
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <p className="auth-switch">
        Ready to continue? <Link to="/login">Login</Link>
      </p>
    </>
  );
}
