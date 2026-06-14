import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SEOHead } from "@/components/seo-head";
import { useBrand } from "@/lib/brand-context";

export default function TermsAndConditions() {
  const { brand, isChroma } = useBrand();
  const brandName   = brand?.name   ?? "Chroma Travel";
  const brandEmail  = brand?.email  ?? "contacto@chromatravel.online";
  const brandDomain = brand?.domain ?? "chromatravel.online";
  const brandWa     = brand?.whatsappNumber ?? "+524434044104";
  const brandWaClean = brandWa.replace(/[^0-9]/g, "");

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={`Términos y Condiciones | ${brandName}`}
        description={`Términos y condiciones de uso de ${brandName}. Conoce las políticas de reservación, cancelación y servicio de nuestra agencia de viajes.`}
      />
      <Navigation />
      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <div className="mt-10 space-y-8 text-foreground/90">
            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                1. Aceptación de los Términos
              </h2>
              <p className="mt-4 leading-relaxed">
                Al acceder y utilizar el sitio web {brandDomain} ("el Sitio"), operado por{" "}
                <strong>{brandName}</strong>, aceptas estos Términos y Condiciones en su
                totalidad. Si no estás de acuerdo con alguna parte de estos términos, te
                pedimos que no utilices nuestros servicios.
              </p>
              <p className="mt-4 leading-relaxed">
                {brandName} es una agencia de viajes especializada en experiencias de viaje
                premium{isChroma ? " para la comunidad LGBT+" : ""}, comprometida con ofrecer
                destinos{isChroma ? " seguros, inclusivos y" : ""} de alta calidad en todo el
                mundo.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                2. Servicios Ofrecidos
              </h2>
              <p className="mt-4 leading-relaxed">
                {brandName} actúa como intermediario entre los viajeros y los proveedores de
                servicios turísticos. Nuestros servicios incluyen:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                {isChroma ? (
                  <li>Reservación de hoteles verificados como LGBT+ friendly</li>
                ) : (
                  <li>Reservación de hoteles premium y de lujo</li>
                )}
                <li>Paquetes de viaje personalizados</li>
                {isChroma ? (
                  <li>Asesoría especializada en destinos seguros para viajeros LGBT+</li>
                ) : (
                  <li>Asesoría especializada en destinos y experiencias de lujo</li>
                )}
                <li>Coordinación de experiencias y actividades</li>
                {isChroma && (
                  <li>Información sobre eventos Pride y festivales LGBT+ internacionales</li>
                )}
                <li>Seguros de viaje especializados</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                3. Proceso de Reservación
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold">3.1 Solicitud de Cotización</h3>
                  <p className="mt-2 leading-relaxed">
                    Al solicitar una cotización, te comprometes a proporcionar información veraz
                    y completa. Una cotización no constituye una reservación confirmada hasta
                    que se realice el pago correspondiente.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">3.2 Confirmación de Reservación</h3>
                  <p className="mt-2 leading-relaxed">
                    Una reservación se considera confirmada únicamente cuando:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Se ha recibido el pago del depósito o el pago total según corresponda</li>
                    <li>Has recibido un correo de confirmación con los detalles de tu reservación</li>
                    <li>Los proveedores (hoteles, aerolíneas, etc.) han confirmado la disponibilidad</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">3.3 Documentación Requerida</h3>
                  <p className="mt-2 leading-relaxed">
                    Es responsabilidad del viajero contar con la documentación válida (pasaporte,
                    visas, permisos) requerida para su destino. {brandName} puede asesorarte,
                    pero no se hace responsable por la falta de documentación.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                4. Precios y Pagos
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold">4.1 Precios</h3>
                  <p className="mt-2 leading-relaxed">
                    Los precios mostrados en el sitio son indicativos y pueden variar según
                    disponibilidad, temporada y tipo de cambio. El precio final será confirmado
                    en tu cotización personalizada. Todos los precios incluyen IVA cuando aplique.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">4.2 Métodos de Pago</h3>
                  <p className="mt-2 leading-relaxed">
                    Aceptamos pagos a través de:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Clip (tarjetas de crédito/débito)</li>
                    <li>Transferencia bancaria (previa coordinación)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">4.3 Depósitos</h3>
                  <p className="mt-2 leading-relaxed">
                    Para confirmar la mayoría de las reservaciones se requiere un depósito
                    mínimo del 30% al 50% del total, dependiendo del proveedor y las fechas
                    de viaje. El saldo restante debe pagarse antes de la fecha límite indicada
                    en tu confirmación.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                5. Política de Cancelación y Reembolsos
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold">5.1 Cancelaciones por el Cliente</h3>
                  <p className="mt-2 leading-relaxed">
                    Las políticas de cancelación varían según el proveedor. En general:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li><strong>Más de 30 días antes:</strong> Reembolso del 80-100% (menos gastos administrativos)</li>
                    <li><strong>15-30 días antes:</strong> Reembolso del 50%</li>
                    <li><strong>7-14 días antes:</strong> Reembolso del 25%</li>
                    <li><strong>Menos de 7 días:</strong> Sin reembolso</li>
                  </ul>
                  <p className="mt-2 leading-relaxed">
                    Las condiciones específicas se detallarán en tu confirmación de reservación.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">5.2 Cancelaciones por {brandName} o Proveedores</h3>
                  <p className="mt-2 leading-relaxed">
                    En caso de que {brandName} o un proveedor deba cancelar tu reservación
                    por causas ajenas a tu voluntad, te ofreceremos:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Una alternativa comparable sin costo adicional</li>
                    <li>O un reembolso completo de los montos pagados</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">5.3 Fuerza Mayor</h3>
                  <p className="mt-2 leading-relaxed">
                    No seremos responsables por cancelaciones debido a eventos de fuerza mayor
                    (desastres naturales, pandemias, conflictos armados, etc.). En estos casos,
                    trabajaremos para reprogramar tu viaje o gestionar reembolsos según las
                    políticas de cada proveedor.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                6. Responsabilidades y Limitaciones
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold">6.1 Rol como Intermediario</h3>
                  <p className="mt-2 leading-relaxed">
                    {brandName} actúa como intermediario entre el viajero y los proveedores
                    de servicios (hoteles, aerolíneas, tour operadores). No somos propietarios
                    ni operadores directos de estos servicios.
                  </p>
                </div>
                {isChroma && (
                  <div>
                    <h3 className="font-semibold">6.2 Verificación LGBT+ Friendly</h3>
                    <p className="mt-2 leading-relaxed">
                      Realizamos verificaciones exhaustivas de nuestros hoteles y proveedores
                      asociados. Sin embargo, no podemos garantizar absolutamente las experiencias
                      individuales, ya que dependen de factores externos. Te invitamos a reportar
                      cualquier incidencia para mejorar continuamente.
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{isChroma ? "6.3" : "6.2"} Seguro de Viaje</h3>
                  <p className="mt-2 leading-relaxed">
                    Recomendamos encarecidamente contratar un seguro de viaje que cubra
                    cancelaciones, emergencias médicas y pérdida de equipaje. Podemos
                    asesorarte en la selección de un seguro adecuado.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                7. Uso del Sitio Web
              </h2>
              <p className="mt-4 leading-relaxed">
                Al usar nuestro sitio web, te comprometes a:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-2">
                <li>No utilizar el sitio para fines ilegales o no autorizados</li>
                <li>No intentar acceder a áreas restringidas del sistema</li>
                <li>Proporcionar información veraz y actualizada</li>
                <li>No reproducir el contenido sin autorización escrita</li>
                <li>Respetar los derechos de propiedad intelectual</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                8. Propiedad Intelectual
              </h2>
              <p className="mt-4 leading-relaxed">
                Todo el contenido del sitio (textos, imágenes, logos, diseño) es propiedad de{" "}
                {brandName} o de sus respectivos licenciantes. Queda prohibida su reproducción,
                distribución o modificación sin autorización escrita.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                9. Resolución de Disputas
              </h2>
              <p className="mt-4 leading-relaxed">
                Cualquier disputa relacionada con estos términos será resuelta de acuerdo
                con las leyes de México. Antes de iniciar cualquier procedimiento legal,
                te invitamos a contactarnos para buscar una solución amigable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                10. Modificaciones
              </h2>
              <p className="mt-4 leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos y Condiciones en
                cualquier momento. Los cambios serán efectivos al publicarse en este sitio.
                El uso continuado del sitio después de cambios constituye aceptación de los
                nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                11. Contacto
              </h2>
              <p className="mt-4 leading-relaxed">
                Para preguntas sobre estos Términos y Condiciones:
              </p>
              <div className="mt-4 rounded-lg border bg-muted/30 p-6">
                <p><strong>{brandName}</strong></p>
                <p className="mt-2">Email: <a href={`mailto:${brandEmail}`} className="text-primary hover:underline">{brandEmail}</a></p>
                <p>WhatsApp: <a href={`https://wa.me/${brandWaClean}`} className="text-primary hover:underline">{brandWa}</a></p>
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
