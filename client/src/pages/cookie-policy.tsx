import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SEOHead } from "@/components/seo-head";

export default function CookiePolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead 
        title="Política de Cookies | Chroma Travel - Viajes LGBT+ Premium"
        description="Información sobre el uso de cookies en Chroma Travel. Conoce qué cookies utilizamos y cómo gestionarlas para una mejor experiencia de navegación."
      />
      <Navigation />
      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Política de Cookies
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: Enero 2025
          </p>

          <div className="mt-10 space-y-8 text-foreground/90">
            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                1. ¿Qué son las Cookies?
              </h2>
              <p className="mt-4 leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
                (ordenador, tablet o móvil) cuando visitas un sitio web. Son ampliamente 
                utilizadas para hacer que los sitios web funcionen de manera más eficiente, 
                así como para proporcionar información a los propietarios del sitio.
              </p>
              <p className="mt-4 leading-relaxed">
                En <strong>Chroma Travel</strong>, utilizamos cookies para mejorar tu experiencia 
                de navegación, recordar tus preferencias y analizar cómo utilizas nuestro sitio 
                para poder mejorarlo continuamente.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                2. Tipos de Cookies que Utilizamos
              </h2>
              
              <div className="mt-6 space-y-6">
                <div className="rounded-lg border bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg">Cookies Esenciales</h3>
                  <p className="mt-2 text-muted-foreground">
                    Necesarias para el funcionamiento básico del sitio web.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-semibold">Cookie</th>
                          <th className="py-2 text-left font-semibold">Propósito</th>
                          <th className="py-2 text-left font-semibold">Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">session_id</td>
                          <td className="py-2">Mantener tu sesión activa</td>
                          <td className="py-2">Sesión</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">cookie_consent</td>
                          <td className="py-2">Recordar tu elección de cookies</td>
                          <td className="py-2">1 año</td>
                        </tr>
                        <tr>
                          <td className="py-2">theme_preference</td>
                          <td className="py-2">Recordar modo claro/oscuro</td>
                          <td className="py-2">1 año</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg">Cookies de Análisis</h3>
                  <p className="mt-2 text-muted-foreground">
                    Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-semibold">Cookie</th>
                          <th className="py-2 text-left font-semibold">Propósito</th>
                          <th className="py-2 text-left font-semibold">Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">_ga</td>
                          <td className="py-2">Google Analytics - Distinguir usuarios</td>
                          <td className="py-2">2 años</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">_ga_*</td>
                          <td className="py-2">Google Analytics - Mantener estado de sesión</td>
                          <td className="py-2">2 años</td>
                        </tr>
                        <tr>
                          <td className="py-2">_gid</td>
                          <td className="py-2">Google Analytics - Distinguir usuarios</td>
                          <td className="py-2">24 horas</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg">Cookies de Publicidad</h3>
                  <p className="mt-2 text-muted-foreground">
                    Utilizadas para mostrar anuncios relevantes.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-semibold">Cookie</th>
                          <th className="py-2 text-left font-semibold">Propósito</th>
                          <th className="py-2 text-left font-semibold">Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">__gads</td>
                          <td className="py-2">Google AdSense - Publicidad personalizada</td>
                          <td className="py-2">13 meses</td>
                        </tr>
                        <tr>
                          <td className="py-2">__gpi</td>
                          <td className="py-2">Google AdSense - Identificación de anuncios</td>
                          <td className="py-2">13 meses</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg">Cookies de Funcionalidad</h3>
                  <p className="mt-2 text-muted-foreground">
                    Mejoran la experiencia del usuario recordando preferencias.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-semibold">Cookie</th>
                          <th className="py-2 text-left font-semibold">Propósito</th>
                          <th className="py-2 text-left font-semibold">Duración</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">search_preferences</td>
                          <td className="py-2">Recordar filtros de búsqueda</td>
                          <td className="py-2">30 días</td>
                        </tr>
                        <tr>
                          <td className="py-2">recently_viewed</td>
                          <td className="py-2">Hoteles vistos recientemente</td>
                          <td className="py-2">30 días</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                3. Cookies de Terceros
              </h2>
              <p className="mt-4 leading-relaxed">
                Además de nuestras propias cookies, utilizamos servicios de terceros que 
                también pueden establecer cookies en tu dispositivo:
              </p>
              <ul className="mt-4 space-y-4">
                <li className="rounded-lg border p-4">
                  <strong>Google Analytics</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Para analizar el tráfico del sitio y entender cómo lo utilizan los visitantes.
                  </p>
                </li>
                <li className="rounded-lg border p-4">
                  <strong>Google AdSense</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Para mostrar anuncios relevantes basados en tus intereses. Los ingresos 
                    publicitarios nos ayudan a mantener contenido gratuito de calidad.
                  </p>
                </li>
                <li className="rounded-lg border p-4">
                  <strong>PayPal / Clip</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Para procesar pagos de forma segura cuando realizas una reservación.
                  </p>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                4. Cómo Gestionar las Cookies
              </h2>
              <p className="mt-4 leading-relaxed">
                Puedes controlar y gestionar las cookies de varias formas:
              </p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold">4.1 Banner de Cookies</h3>
                  <p className="mt-2 leading-relaxed">
                    Al visitar nuestro sitio por primera vez, verás un banner donde puedes 
                    aceptar o rechazar las cookies no esenciales.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">4.2 Configuración del Navegador</h3>
                  <p className="mt-2 leading-relaxed">
                    Puedes configurar tu navegador para bloquear o eliminar cookies. 
                    Aquí te mostramos cómo hacerlo en los navegadores más comunes:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                    <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">4.3 Herramientas de Opt-Out</h3>
                  <p className="mt-2 leading-relaxed">
                    Para cookies de publicidad de Google, puedes visitar:
                  </p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li><a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Configuración de anuncios de Google</a></li>
                    <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Complemento de inhabilitación de Google Analytics</a></li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-sm">
                  <strong>Nota:</strong> Si desactivas las cookies, algunas partes del sitio 
                  pueden no funcionar correctamente. Por ejemplo, no podremos recordar tus 
                  preferencias de búsqueda o tu sesión activa.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                5. Actualizaciones de esta Política
              </h2>
              <p className="mt-4 leading-relaxed">
                Podemos actualizar esta Política de Cookies periódicamente para reflejar 
                cambios en nuestras prácticas o por razones legales. Te recomendamos 
                revisar esta página regularmente para estar informado sobre cómo usamos 
                las cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                6. Contacto
              </h2>
              <p className="mt-4 leading-relaxed">
                Si tienes preguntas sobre nuestra Política de Cookies:
              </p>
              <div className="mt-4 rounded-lg border bg-muted/30 p-6">
                <p><strong>Chroma Travel</strong> by Fénix Traveler</p>
                <p className="mt-2">Email: <a href="mailto:contacto@chromatravel.online" className="text-primary hover:underline">contacto@chromatravel.online</a></p>
                <p>WhatsApp: <a href="https://wa.me/5218000000000" className="text-primary hover:underline">+52 1 800 000 0000</a></p>
                <p className="mt-2">Sitio web: <a href="https://chromatravel.online" className="text-primary hover:underline">chromatravel.online</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
