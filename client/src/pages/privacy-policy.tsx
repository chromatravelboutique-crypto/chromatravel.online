import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SEOHead } from "@/components/seo-head";
import { useBrand } from "@/lib/brand-context";

export default function PrivacyPolicy() {
  const { brand, isChroma } = useBrand();
  const brandName   = brand?.name   ?? "Chroma Travel";
  const brandEmail  = brand?.email  ?? "contacto@chromatravel.online";
  const brandDomain = brand?.domain ?? "chromatravel.online";

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={`Política de Privacidad | ${brandName}`}
        description={`Conoce cómo ${brandName} protege tu información personal. Política de privacidad transparente para nuestros clientes.`}
      />
      <Navigation />
      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <div className="mt-10 space-y-8 text-foreground/90">
            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                1. Introducción
              </h2>
              <p className="mt-4 leading-relaxed">
                En <strong>{brandName}</strong> ({brandDomain}), 
                nos comprometemos a proteger tu privacidad y tus datos personales. Esta política 
                describe cómo recopilamos, usamos, almacenamos y protegemos tu información cuando 
                utilizas nuestros servicios de agencia de viajes especializada en experiencias LGBT+ premium.
              </p>
              <p className="mt-4 leading-relaxed">
                Como agencia comprometida con la comunidad LGBT+, entendemos la importancia de la 
                confidencialidad y el respeto a tu identidad. Todos los datos que nos proporcionas 
                son tratados con el máximo cuidado y nunca serán compartidos sin tu consentimiento expreso.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                2. Información que Recopilamos
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold">2.1 Información Personal</h3>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Nombre completo y datos de contacto (email, teléfono)</li>
                    <li>Información de pasaporte y documentos de viaje (cuando sea necesario para reservaciones)</li>
                    <li>Preferencias de viaje y requisitos especiales</li>
                    <li>Historial de reservaciones y consultas</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">2.2 Información de Pago</h3>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Datos de tarjetas de crédito/débito (procesados de forma segura mediante Clip)</li>
                    <li>Historial de transacciones</li>
                    <li>Información de facturación</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">2.3 Información Técnica</h3>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Dirección IP y datos de ubicación aproximada</li>
                    <li>Tipo de navegador y dispositivo</li>
                    <li>Páginas visitadas y tiempo de navegación</li>
                    <li>Cookies y tecnologías similares</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                3. Uso de tu Información
              </h2>
              <p className="mt-4 leading-relaxed">
                Utilizamos tu información para:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                <li>Procesar y gestionar tus reservaciones de hoteles, vuelos y experiencias</li>
                <li>Personalizar recomendaciones de viaje basadas en tus preferencias</li>
                <li>Comunicarnos contigo sobre tus reservas y consultas</li>
                <li>Enviarte ofertas exclusivas y contenido relevante (solo con tu consentimiento)</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
                <li>Prevenir fraudes y garantizar la seguridad de las transacciones</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                4. Compartir Información con Terceros
              </h2>
              <p className="mt-4 leading-relaxed">
                Compartimos tu información únicamente cuando es necesario para:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                <li><strong>Proveedores de servicios:</strong> Hoteles, aerolíneas y operadores turísticos para confirmar reservaciones</li>
                <li><strong>Procesadores de pago:</strong> Clip para procesar transacciones de forma segura</li>
                <li><strong>Servicios de análisis:</strong> Google Analytics para mejorar nuestra plataforma</li>
                <li><strong>Obligaciones legales:</strong> Cuando sea requerido por ley o autoridades competentes</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                <strong>Nunca vendemos tu información personal a terceros.</strong> Todos nuestros 
                proveedores están obligados contractualmente a proteger tu información.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                5. Seguridad de tus Datos
              </h2>
              <p className="mt-4 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                <li>Encriptación SSL/TLS en todas las comunicaciones</li>
                <li>Almacenamiento seguro de contraseñas con hash bcrypt</li>
                <li>Acceso restringido a datos personales solo a personal autorizado</li>
                <li>Monitoreo continuo de seguridad y actualizaciones regulares</li>
                <li>Procesamiento de pagos a través de proveedores certificados PCI-DSS</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                6. Tus Derechos
              </h2>
              <p className="mt-4 leading-relaxed">
                De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los 
                Particulares (LFPDPPP) de México, tienes derecho a:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre ti</li>
                <li><strong>Rectificación:</strong> Corregir información incorrecta o desactualizada</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos</li>
                <li><strong>Oposición:</strong> Oponerte al uso de tus datos para ciertos fines</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                Para ejercer estos derechos, contáctanos en:{" "}
                <a href="mailto:{brandEmail}" className="text-primary hover:underline">
                  {brandEmail}
                </a>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                7. Retención de Datos
              </h2>
              <p className="mt-4 leading-relaxed">
                Conservamos tu información personal durante el tiempo necesario para cumplir con 
                los fines descritos en esta política, o según lo requiera la ley. Los datos de 
                reservaciones se mantienen por un mínimo de 5 años para cumplir con obligaciones 
                fiscales y legales.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                8. Cambios a esta Política
              </h2>
              <p className="mt-4 leading-relaxed">
                Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios 
                significativos a través de nuestro sitio web o por correo electrónico. Te 
                recomendamos revisar esta página regularmente.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                9. Contacto
              </h2>
              <p className="mt-4 leading-relaxed">
                Si tienes preguntas sobre esta política o sobre cómo manejamos tus datos, contáctanos:
              </p>
              <div className="mt-4 rounded-lg border bg-muted/30 p-6">
                <p><strong>{brandName}</strong></p>
                <p className="mt-2">Email: <a href="mailto:{brandEmail}" className="text-primary hover:underline">{brandEmail}</a></p>
                <p>WhatsApp: <a href={`https://wa.me/${(brand?.whatsappNumber ?? "+524434044104").replace(/[^0-9]/g, "")}`} className="text-primary hover:underline">{brand?.whatsappNumber ?? "+52 443 404 4104"}</a></p>
                <p className="mt-2">Sitio web: <a href={`https://${brandDomain}`} className="text-primary hover:underline">{brandDomain}</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
