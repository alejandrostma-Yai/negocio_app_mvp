import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";

export default function HistorialPage() {
  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <h1>Historial</h1>
        <div className="field">
          <label>Buscar por cliente</label>
          <input placeholder="Nombre del cliente" />
        </div>
        <div className="card">
          <div style={{color:"#6b7280"}}>Los movimientos más recientes aparecerán primero.</div>
        </div>
      </main>
    </AuthGuard>
  );
}
