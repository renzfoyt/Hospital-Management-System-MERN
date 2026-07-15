import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { checkAdminSession } from "../config/adminAuth";

// Client-side gate: keeps logged-out visitors from ever rendering the
// dashboard shell. The JWT lives in an httpOnly cookie now, so we can't
// just read localStorage — we ping /api/auth/verify on mount instead.
// Real enforcement still happens on the backend regardless.
const RequireAdminAuth = ({ children }) => {
  const [status, setStatus] = useState("checking"); // "checking" | "authed" | "unauthed"

  useEffect(() => {
    let cancelled = false;
    checkAdminSession().then((ok) => {
      if (!cancelled) setStatus(ok ? "authed" : "unauthed");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "unauthed") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default RequireAdminAuth;