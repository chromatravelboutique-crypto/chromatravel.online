import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import AdminLayout from '@/pages/Admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Hotel, 
  FileSpreadsheet, 
  ExternalLink, 
  Maximize2,
  Calendar,
  Building2,
  Loader2,
  Star,
  Gift,
  ArrowRight
} from 'lucide-react';

interface BloqueosSettings {
  bloqueos_hotels_iframe?: string | null;
  bloqueos_hotels_direct?: string | null;
  bloqueos_spreadsheet_iframe?: string | null;
  bloqueos_spreadsheet_direct?: string | null;
  bloqueos_precompras_iframe?: string | null;
  bloqueos_precompras_direct?: string | null;
}

const defaultSettings: BloqueosSettings = {
  bloqueos_hotels_iframe: 'https://omditravelmx.com/bloqueos/hotels',
  bloqueos_hotels_direct: 'https://omditravelmx.com/bloqueos/hotels',
  bloqueos_spreadsheet_iframe: 'https://docs.google.com/spreadsheets/d/1QMobJOGokr_69L_Np0GGu0BmiKRP3Hfw/preview',
  bloqueos_spreadsheet_direct: 'https://docs.google.com/spreadsheets/d/1QMobJOGokr_69L_Np0GGu0BmiKRP3Hfw/',
  bloqueos_precompras_iframe: 'https://docs.google.com/spreadsheets/d/13DQ9Dn4GyALncZcm_n5Cuj7jZt6t3RsP/preview?gid=233097423',
  bloqueos_precompras_direct: 'https://docs.google.com/spreadsheets/d/13DQ9Dn4GyALncZcm_n5Cuj7jZt6t3RsP/edit?gid=233097423#gid=233097423'
};

export default function Bloqueos() {
  const [activeTab, setActiveTab] = useState('hotels');
  const [settings, setSettings] = useState<BloqueosSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/bloqueos');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resources = {
    hotels: {
      title: 'Tarifas Exclusivas Fénix Traveler',
      description: 'Consulta la disponibilidad de habitaciones en tiempo real',
      url: settings.bloqueos_hotels_iframe ?? defaultSettings.bloqueos_hotels_iframe ?? '',
      directUrl: settings.bloqueos_hotels_direct ?? defaultSettings.bloqueos_hotels_direct ?? '',
      icon: Hotel,
      color: 'text-blue-600'
    },
    spreadsheet: {
      title: 'Inventario General',
      description: 'Hoja de cálculo con inventario detallado',
      url: settings.bloqueos_spreadsheet_iframe ?? defaultSettings.bloqueos_spreadsheet_iframe ?? '',
      directUrl: settings.bloqueos_spreadsheet_direct ?? defaultSettings.bloqueos_spreadsheet_direct ?? '',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    precompras: {
      title: 'Reservas Anticipadas',
      description: 'Registro de reservas anticipadas especiales',
      url: settings.bloqueos_precompras_iframe ?? defaultSettings.bloqueos_precompras_iframe ?? '',
      directUrl: settings.bloqueos_precompras_direct ?? defaultSettings.bloqueos_precompras_direct ?? '',
      icon: Calendar,
      color: 'text-purple-600'
    }
  };

  return (
    <AdminLayout title="Tarifas Exclusivas Fénix Traveler" activeMenu="bloqueos">
      <div className="space-y-6">
        
        {/* Banner Programa de Puntos Premium */}
        <Card className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-primary/10 border-secondary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-secondary/20 p-3 rounded-full">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Gift className="w-5 h-5 text-secondary" />
                    Programa Puntos Premium Fénix
                  </h3>
                  <p className="text-sm text-gray-600">
                    Gana hasta <span className="font-bold text-secondary">3x puntos</span> en hoteles selectos. 
                    Multiplica tus recompensas con cada reserva.
                  </p>
                </div>
              </div>
              <Link href="/programa-puntos-premium">
                <Button className="bg-secondary hover:bg-secondary/90 text-white" data-testid="btn-programa-puntos">
                  Ver Detalles
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="hotels" className="flex items-center gap-2" data-testid="tab-hotels">
              <Hotel size={18} />
              Hoteles
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="flex items-center gap-2" data-testid="tab-spreadsheet">
              <FileSpreadsheet size={18} />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="precompras" className="flex items-center gap-2" data-testid="tab-precompras">
              <Calendar size={18} />
              Reservas Anticipadas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tarifas Exclusivas */}
          <TabsContent value="hotels">
            <Card className="overflow-hidden">
              <CardHeader className="bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Hotel className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{resources.hotels.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{resources.hotels.description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(resources.hotels.directUrl, '_blank')}
                    data-testid="btn-open-hotels"
                  >
                    <Maximize2 size={16} className="mr-2" />
                    Ver Completo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
                  <iframe
                    src={resources.hotels.url}
                    className="w-full h-full border-0"
                    title="Tarifas Exclusivas Fénix Traveler"
                    loading="lazy"
                    data-testid="iframe-hotels"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Hoja de Cálculo */}
          <TabsContent value="spreadsheet">
            <Card className="overflow-hidden">
              <CardHeader className="bg-green-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{resources.spreadsheet.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{resources.spreadsheet.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(resources.spreadsheet.directUrl, '_blank')}
                      data-testid="btn-open-spreadsheet"
                    >
                      <Maximize2 size={16} className="mr-2" />
                      Ver Completo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
                  <iframe
                    src={resources.spreadsheet.url}
                    className="w-full h-full border-0"
                    title="Inventario de Tarifas Exclusivas"
                    loading="lazy"
                    data-testid="iframe-spreadsheet"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Reservas Anticipadas */}
          <TabsContent value="precompras">
            <Card className="overflow-hidden">
              <CardHeader className="bg-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{resources.precompras.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{resources.precompras.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(resources.precompras.directUrl, '_blank')}
                      data-testid="btn-open-precompras"
                    >
                      <Maximize2 size={16} className="mr-2" />
                      Ver Completo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
                  <iframe
                    src={resources.precompras.url}
                    className="w-full h-full border-0"
                    title="Reservas Anticipadas"
                    loading="lazy"
                    data-testid="iframe-precompras"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6">
            <Building2 className="w-10 h-10 text-secondary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Hoteles Disponibles</h3>
            <p className="text-sm text-gray-500">
              Consulta la disponibilidad de más de 50 hoteles en destinos top
            </p>
          </Card>
          <Card className="text-center p-6">
            <Calendar className="w-10 h-10 text-secondary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Actualización Diaria</h3>
            <p className="text-sm text-gray-500">
              Las tarifas se actualizan cada 24 horas con información fresca
            </p>
          </Card>
          <Card className="text-center p-6">
            <FileSpreadsheet className="w-10 h-10 text-secondary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Exportable</h3>
            <p className="text-sm text-gray-500">
              Descarga la información en formato Excel para análisis
            </p>
          </Card>
        </div>

        {/* Nota de Uso */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Esta información es de uso interno para agentes de Fénix Traveler. 
            Si experimentas problemas de carga, usa los botones para abrir en nueva pestaña.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
