// Identidad provisional: tortuga estilizada (Galápagos) + flecha de ciclo.
// Usa currentColor y los tokens de marca, así que funciona en modo claro y oscuro.

export function Isotipo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--marca)" />
      {/* caparazón */}
      <path d="M8 18.5c0-4.7 3.6-8.5 8-8.5s8 3.8 8 8.5H8z" fill="var(--sobre-marca)" />
      <path
        d="M12.2 18.5c0-2.6 1.7-4.6 3.8-4.6s3.8 2 3.8 4.6"
        fill="none"
        stroke="var(--marca)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* cabeza y patas */}
      <circle cx="25.6" cy="16.6" r="1.9" fill="var(--sobre-marca)" />
      <rect x="9.5" y="19.3" width="3" height="3.2" rx="1.2" fill="var(--sobre-marca)" />
      <rect x="19.5" y="19.3" width="3" height="3.2" rx="1.2" fill="var(--sobre-marca)" />
      {/* flecha de ciclo */}
      <path d="M7 24.8h15.5" stroke="var(--acento-suave)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.6 23.1l2.2 1.7-2.2 1.7" fill="none" stroke="var(--acento-suave)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logotipo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Isotipo />
      <span className="text-lg font-bold tracking-tight text-texto">
        Galapa<span className="text-marca">Go</span>
      </span>
    </span>
  );
}
