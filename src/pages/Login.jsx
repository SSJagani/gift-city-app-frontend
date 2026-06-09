import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import AuthNotice from "../components/AuthNotice.jsx";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form, { remember });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h2>Sign in to your account</h2>
        <p>Use your registered GIFT CITY credentials.</p>
      </div>
      <AuthNotice>{error}</AuthNotice>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          icon={Mail}
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          placeholder="Enter email"
          autoComplete="email"
        />
        <FormField
          icon={Lock}
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          placeholder="Enter password"
          autoComplete="current-password"
        />
        <div className="form-row">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
      <p className="auth-switch">
        Do not have an account? <Link to="/register">Sign up</Link>
      </p>
    </>
  );
}
