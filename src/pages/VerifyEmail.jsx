import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, KeyRound } from "lucide-react";
import { authApi } from "../api/http.js";
import AuthNotice from "../components/AuthNotice.jsx";
import FormField from "../components/FormField.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const payload = await authApi.verifyEmail(token);
      setMessage(payload.message || "Email verified successfully.");
    } catch (err) {
      setError(err.message || "Unable to verify email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h2>Verify email</h2>
        <p>Confirm your account before protected workflows begin.</p>
      </div>
      <AuthNotice>{error}</AuthNotice>
      <AuthNotice type="success">{message}</AuthNotice>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          icon={KeyRound}
          label="Verification token"
          name="token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste verification token"
          autoComplete="one-time-code"
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          <BadgeCheck size={18} aria-hidden="true" />
          {submitting ? "Verifying..." : "Verify email"}
        </button>
      </form>
      <p className="auth-switch">
        Back to <Link to="/login">Login</Link>
      </p>
    </>
  );
}
