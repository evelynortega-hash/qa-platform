import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA Platform",
  description: "InnoSupps QA Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#F7F7F5" }}>{children}</body>
    </html>
  );
}
