import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function AdminMenuSection({ children }: Props) {
  // Minimal wrapper component to satisfy import; can be expanded later.
  return <>{children}</>;
}
