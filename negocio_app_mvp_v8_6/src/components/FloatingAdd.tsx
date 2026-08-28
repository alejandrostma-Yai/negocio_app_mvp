import Link from "next/link";

export default function FloatingAdd() {
  return <Link className="fab" href="/agenda/nueva" aria-label="Nueva venta">+</Link>;
}
