import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserRound } from "lucide-react";
import AuthNotice from "../components/AuthNotice.jsx";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="auth-heading">
        <h2>Create account</h2>
        <p>Start tracking weekly stock inputs and reports.</p>
      </div>
      <AuthNotice>{error}</AuthNotice>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          icon={UserRound}
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={updateField}
          placeholder="Enter full name"
          autoComplete="name"
        />
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
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          minLength={8}
        />
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Sign up"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </>
  );
}
