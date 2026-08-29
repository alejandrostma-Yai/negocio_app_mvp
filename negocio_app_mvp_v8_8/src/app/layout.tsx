import "./globals.css";

export const metadata = {
  title: "OG · Control de Negocio",
  description: "Control diario de ventas, capital, casa y meta",
  themeColor: "#07111f"
};

const themeBoot = `
(function () {
  try {
    var saved = localStorage.getItem('og-theme') || 'dark';
    var resolved = saved === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : saved;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = saved;
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.themePreference = 'dark';
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
