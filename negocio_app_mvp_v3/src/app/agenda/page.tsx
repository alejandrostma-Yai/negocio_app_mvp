import Nav from "@/components/Nav";
import FloatingAdd from "@/components/FloatingAdd";
import AuthGuard from "@/components/AuthGuard";

export default function AgendaPage() {
  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <h1>Agenda</h1>
        <div className="card">
          <strong>Calendario</strong>
          <p style={{color:"#6b7280"}}>Aquí irá el calendario mensual. Al seleccionar un día, las ventas de ese día aparecerán debajo.</p>
        </div>
        <h2 className="section-title">Ventas del día</h2>
        <div className="card" style={{color:"#6b7280"}}>Sin ventas programadas.</div>
        <FloatingAdd />
      </main>
    </AuthGuard>
  );
}
