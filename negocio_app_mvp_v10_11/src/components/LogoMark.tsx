export default function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`og-mark${compact ? " compact" : ""}`} aria-label="OG">
      <span className="og-letters">OG</span>
      <span className="og-stripe og-stripe-one" aria-hidden="true" />
      <span className="og-stripe og-stripe-two" aria-hidden="true" />
    </span>
  );
}
