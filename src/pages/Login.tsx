// This file is deprecated - use Auth.tsx instead
import { Navigate } from "react-router-dom";

export default function Login() {
  return <Navigate to="/auth" replace />;
}