export default function AuthNotice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  return <div className={`notice ${type}`}>{children}</div>;
}
