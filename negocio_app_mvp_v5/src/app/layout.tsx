import "./globals.css";

export const metadata = {
  title: "Control de Negocio",
  description: "Control diario de ventas, capital, casa y meta"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
