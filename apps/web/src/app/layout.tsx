import './global.css';

export const metadata = {
  title: 'Welcome to Hiveforge',
  description: 'HiveForge: Digital AI Workforce Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
