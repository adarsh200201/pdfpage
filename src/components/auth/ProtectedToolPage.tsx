import React from "react";
import AuthGuard from "./AuthGuard";

interface ProtectedToolPageProps {
  children: React.ReactNode;
  toolName?: string;
}

/**
 * Wrapper component that protects tool pages with authentication
 * This ensures all PDF tools require login before use
 */
const ProtectedToolPage: React.FC<ProtectedToolPageProps> = ({
  children,
  toolName,
}) => {
  return <AuthGuard>{children}</AuthGuard>;
};

export default ProtectedToolPage;
