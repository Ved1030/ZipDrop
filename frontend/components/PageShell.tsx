import type { ReactNode } from "react";

export default function PageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <h1>{title}</h1>
      {updated ? <p className="legal-updated">Last updated: {updated}</p> : null}
      {children}
    </main>
  );
}
