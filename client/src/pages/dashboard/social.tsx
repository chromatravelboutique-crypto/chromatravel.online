import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Share2,
  Rss,
  ExternalLink,
  Facebook,
  Instagram,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Users,
  DollarSign,
  ShoppingBag,
  Zap,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardLayout } from "./dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { FaAmazon } from "react-icons/fa";

export default function SocialDashboard() {
  const { toast } = useToast();
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  
  const rssFeedUrl = "https://chromatravel.online/blog/feed.xml";
  const atomFeedUrl = "https://chromatravel.online/blog/atom.xml";
  const jsonFeedUrl = "https://chromatravel.online/blog/feed.json";
  
  const { data: pendingPosts } = useQuery({
    queryKey: ["/api/automation/pending-posts"],
  });

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFeed(type);
      toast({
        title: "Copiado",
        description: `URL del feed ${type} copiada al portapapeles`,
      });
      setTimeout(() => setCopiedFeed(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout
      title="Redes Sociales"
      description="Automatiza la publicacion de contenido en Facebook e Instagram"
    >
      <Tabs defaultValue="metricool" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="metricool" className="gap-2" data-testid="tab-metricool">
            <Share2 className="h-4 w-4" />
            Metricool
          </TabsTrigger>
          <TabsTrigger value="amazon" className="gap-2" data-testid="tab-amazon">
            <FaAmazon className="h-4 w-4" />
            Amazon Afiliados
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4" />
            Metricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metricool" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Posts Pendientes</p>
                    <p className="text-2xl font-bold" data-testid="stat-pending-posts">
                      {Array.isArray(pendingPosts) ? pendingPosts.length : 0}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Facebook</p>
                    <p className="text-sm font-medium">@chromatravelboutique</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Facebook className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Instagram</p>
                    <p className="text-sm font-medium">@chroma.travel.boutique</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                    <Instagram className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Listo para conectar</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Conectar Metricool
              </CardTitle>
              <CardDescription>
                Configura la publicacion automatica de tus posts del blog en Facebook e Instagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Rss className="h-4 w-4" />
                <AlertTitle>Tu RSS Feed esta listo</AlertTitle>
                <AlertDescription>
                  Metricool detectara automaticamente las imagenes de tus posts usando og:image
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">URLs de tus Feeds</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Badge variant="outline" className="shrink-0">RSS 2.0</Badge>
                    <code className="flex-1 truncate text-sm text-muted-foreground">{rssFeedUrl}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(rssFeedUrl, "RSS")}
                      data-testid="button-copy-rss"
                    >
                      {copiedFeed === "RSS" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <a href={rssFeedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Badge variant="outline" className="shrink-0">Atom</Badge>
                    <code className="flex-1 truncate text-sm text-muted-foreground">{atomFeedUrl}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(atomFeedUrl, "Atom")}
                      data-testid="button-copy-atom"
                    >
                      {copiedFeed === "Atom" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Badge variant="outline" className="shrink-0">JSON</Badge>
                    <code className="flex-1 truncate text-sm text-muted-foreground">{jsonFeedUrl}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(jsonFeedUrl, "JSON")}
                      data-testid="button-copy-json"
                    >
                      {copiedFeed === "JSON" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">Pasos para Configurar Metricool</h4>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                    <span>Ve a <a href="https://metricool.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">metricool.com</a> y crea una cuenta gratis</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                    <span>Conecta tus cuentas de Facebook (@chromatravelboutique) e Instagram (@chroma.travel.boutique)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                    <span>Ve a <strong>Planning → Autolists → Nueva Autolist</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</span>
                    <span>Selecciona las redes donde quieres publicar (Facebook, Instagram)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">5</span>
                    <span>Haz clic en <strong>"Vincular RSS"</strong> y pega el URL del feed RSS de arriba</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">6</span>
                    <span>Configura horarios de publicacion y activa <strong>"Repetir"</strong> para reciclar contenido</span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild data-testid="button-open-metricool">
                  <a href="https://app.metricool.com/planning/autolists" target="_blank" rel="noopener noreferrer">
                    <Share2 className="mr-2 h-4 w-4" />
                    Abrir Metricool
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://help.metricool.com/en/article/what-is-an-rss-feed-and-how-does-it-work-in-metricool-10y3yud/" target="_blank" rel="noopener noreferrer">
                    Ver Guia de Metricool
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amazon" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Comision Equipaje</p>
                    <p className="text-2xl font-bold">4%</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Cookie</p>
                    <p className="text-2xl font-bold">24h</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Pago Minimo</p>
                    <p className="text-2xl font-bold">$10</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pendiente registro</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaAmazon className="h-5 w-5" />
                Amazon Associates
              </CardTitle>
              <CardDescription>
                Monetiza tu blog con enlaces de afiliado a productos de viaje
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>Productos Recomendados para Viajes</AlertTitle>
                <AlertDescription>
                  Maletas, adaptadores, power banks, camaras, guias de viaje - todo con comisiones del 1-4.5%
                </AlertDescription>
              </Alert>

              <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">Pasos para Registrarse en Amazon Associates</h4>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                    <span>Ve a <a href="https://affiliate-program.amazon.com.mx" target="_blank" rel="noopener noreferrer" className="text-primary underline">affiliate-program.amazon.com.mx</a></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                    <span>Crea una cuenta con tu email de Chroma Travel</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                    <span>Registra <strong>chromatravel.online</strong> como tu sitio web</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</span>
                    <span>Genera <strong>3 ventas</strong> en los primeros 180 dias para mantener tu cuenta</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">5</span>
                    <span>Usa SiteStripe para crear enlaces mientras navegas Amazon</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Ideas de Contenido con Afiliados</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4 text-primary" />
                      Lista de Equipaje LGBT+ 2026
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Maletas, organizadores, productos Pride
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4 text-primary" />
                      Gadgets para Viajeros
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Power banks, adaptadores, camaras
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4 text-primary" />
                      Guias de Destino
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Libros Lonely Planet, mapas, frasebooks
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4 text-primary" />
                      Equipo de Playa
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Protector solar, toallas, snorkel
                    </p>
                  </div>
                </div>
              </div>

              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Disclosure Requerido</AlertTitle>
                <AlertDescription>
                  Agrega este texto en tu footer o posts con enlaces: "Como Asociado de Amazon, gano por compras que califican."
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <Button asChild data-testid="button-open-amazon">
                  <a href="https://affiliate-program.amazon.com.mx" target="_blank" rel="noopener noreferrer">
                    <FaAmazon className="mr-2 h-4 w-4" />
                    Registrarse en Amazon
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks Totales</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Generados</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversiones</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-2xl font-bold">$0</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Metricas de Redes Sociales</CardTitle>
              <CardDescription>
                Los datos aparecerán una vez que conectes Metricool y Amazon Associates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Sin datos aun</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Conecta Metricool y registrate en Amazon Associates para comenzar a ver metricas de rendimiento
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" asChild>
                    <a href="https://metricool.com" target="_blank" rel="noopener noreferrer">
                      <Share2 className="mr-2 h-4 w-4" />
                      Conectar Metricool
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://affiliate-program.amazon.com.mx" target="_blank" rel="noopener noreferrer">
                      <FaAmazon className="mr-2 h-4 w-4" />
                      Amazon Associates
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
