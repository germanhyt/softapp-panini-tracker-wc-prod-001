import Link from 'next/link'
import { BrandLogo } from '@/components/brand/brand-logo'
import { SiteFooter } from '@/components/layout/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad | Panini 2026 Tracker',
  description: 'Cómo Panini Tracker recopila, usa y protege tus datos personales.',
}

export default function PrivacidadPage() {
  return (
    <div className="public-shell">
      <header className="public-header brand-header">
        <BrandLogo size="lg" linked href="/mercado" subtitle="Política de privacidad" />
        <div className="public-header-actions">
          <Link href="/mercado" className="btn-secondary">
            Volver al mercado
          </Link>
        </div>
      </header>

      <main className="main-content public-main">
        <article className="card privacy-policy">
          <h1 className="page-title">Política de privacidad</h1>
          <p className="muted-small">Última actualización: junio 2026</p>

          <section>
            <h2>1. Responsable</h2>
            <p>
              Panini Tracker es una aplicación para que coleccionistas gestionen su álbum Panini Mundial 2026,
              encuentren intercambios y publiquen ofertas en un mercado público opcional.
            </p>
          </section>

          <section>
            <h2>2. Datos que recopilamos</h2>
            <ul>
              <li>
                <strong>Cuenta:</strong> correo electrónico, nombre, apellido, país y contraseña (almacenada de
                forma cifrada).
              </li>
              <li>
                <strong>Colección:</strong> figuritas marcadas como pegadas, faltantes o repetidas, incluidas
                promocionales que agregues manualmente.
              </li>
              <li>
                <strong>Mercado (opcional):</strong> si activas la visibilidad pública, mostramos tu nombre
                abreviado (ej. &quot;Juan P.&quot;), país, foto de perfil (si la tienes) y las figuritas que
                decidas publicar como oferta o búsqueda.
              </li>
              <li>
                <strong>Técnicos:</strong> registros de acceso básicos del servidor para seguridad y diagnóstico.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Para qué usamos tus datos</h2>
            <ul>
              <li>Autenticarte y mantener tu sesión.</li>
              <li>Guardar y mostrar el avance de tu álbum.</li>
              <li>Calcular matches de intercambio con otros usuarios de tu mismo país.</li>
              <li>Publicar en el mercado solo lo que tú habilites explícitamente.</li>
              <li>Enviar correos transaccionales (verificación, recuperación de contraseña).</li>
            </ul>
          </section>

          <section>
            <h2>4. Qué NO hacemos</h2>
            <ul>
              <li>No vendemos ni alquilamos tus datos personales.</li>
              <li>No mostramos tu correo electrónico en el mercado público.</li>
              <li>No publicamos tu colección en el mercado sin tu consentimiento explícito.</li>
            </ul>
          </section>

          <section>
            <h2>5. Visibilidad en el mercado público</h2>
            <p>
              El mercado en <Link href="/mercado">/mercado</Link> es visible sin iniciar sesión. Solo aparecen
              usuarios que activaron &quot;Perfil visible&quot; y eligieron publicar repetidas y/o faltantes. Puedes
              desactivar estas opciones en cualquier momento desde tu perfil.
            </p>
          </section>

          <section>
            <h2>6. Conservación</h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa. Los tokens de verificación y
              restablecimiento de contraseña expiran automáticamente (24 h y 1 h respectivamente).
            </p>
          </section>

          <section>
            <h2>7. Tus derechos</h2>
            <p>
              Puedes actualizar tu perfil desde la aplicación. Para solicitar eliminación de cuenta o corrección
              de datos, escribe al administrador del sitio usando el correo configurado en el servicio.
            </p>
          </section>

          <section>
            <h2>8. Seguridad</h2>
            <p>
              Usamos conexión cifrada (HTTPS), contraseñas hasheadas y controles de acceso por sesión. Ningún
              sistema es 100 % infalible; te recomendamos usar una contraseña única.
            </p>
          </section>

          <section>
            <h2>9. Cambios</h2>
            <p>
              Podemos actualizar esta política. La fecha de la última revisión aparecerá al inicio del documento.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
