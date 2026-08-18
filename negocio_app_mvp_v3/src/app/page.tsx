import Nav from "@/components/Nav";
import FloatingAdd from "@/components/FloatingAdd";
import AuthGuard from "@/components/AuthGuard";

const demo = {
  brutoDia: 0,
  capital: 0,
  casa: 0,
  metaActual: 0,
  metaObjetivo: 2150538,
  unidadesCompletadas: 0,
  metaUnidades: 12
};

export default function Home() {
  const progresoMeta = demo.metaObjetivo > 0
    ? Math.min((demo.metaActual / demo.metaObjetivo) * 100, 100)
    : 0;

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />

        <section className="hero">
          <div className="hero-label">Monto bruto de hoy</div>
          <div className="hero-amount">RD${demo.brutoDia.toLocaleString("es-DO")}</div>
        </section>

        <section className="grid">
          <div className="card">
            <h3>Capital de trabajo</h3>
            <div className="amount">RD${demo.capital.toLocaleString("es-DO")}</div>
            <div style={{marginTop: 10}}><a className="btn secondary" href="/capital">Modificar</a></div>
          </div>

          <div className="card">
            <h3>Fondo de casa</h3>
            <div className="amount">RD${demo.casa.toLocaleString("es-DO")}</div>
          </div>

          <div className="card">
            <h3>Meta financiera</h3>
            <div className="amount">RD${demo.metaActual.toLocaleString("es-DO")}</div>
            <div className="progress"><div style={{width: `${progresoMeta}%`}} /></div>
            <div style={{marginTop: 8, color: "#6b7280", fontSize: 13}}>
              Objetivo: RD${demo.metaObjetivo.toLocaleString("es-DO")}
            </div>
          </div>
        </section>

        <h2 className="section-title">Meta diaria</h2>
        <div className="card">
          <div className="amount">{demo.unidadesCompletadas} / {demo.metaUnidades} unidades</div>
          <div className="progress">
            <div style={{width: `${Math.min((demo.unidadesCompletadas / demo.metaUnidades) * 100, 100)}%`}} />
          </div>
        </div>

        <h2 className="section-title">Agenda de hoy</h2>
        <div className="card">
          <div style={{color:"#6b7280"}}>Todavía no hay ventas para hoy.</div>
        </div>

        <h2 className="section-title">Actividad reciente</h2>
        <div className="card">
          <div style={{color:"#6b7280"}}>Los movimientos aparecerán aquí.</div>
        </div>

        <FloatingAdd />
      </main>
    </AuthGuard>
  );
}
