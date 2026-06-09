import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { authApi } from "../api/http.js";
import AuthNotice from "../components/AuthNotice.jsx";
import FormField from "../components/FormField.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const payload = await authApi.forgotPassword(email);
      setMessage(payload.message || "If the email exists, reset instructions were sent.");
    } catch (err) {
      setError(err.message || "Unable to request password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h2>Reset password</h2>
        <p>Enter your email to start password recovery.</p>
      </div>
      <AuthNotice>{error}</AuthNotice>
      <AuthNotice type="success">{message}</AuthNotice>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          icon={Mail}
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter email"
          autoComplete="email"
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="auth-switch">
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </>
  );
}
