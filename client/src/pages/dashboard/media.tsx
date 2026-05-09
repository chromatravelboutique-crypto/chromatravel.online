import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Image,
  Search,
  Grid,
  List,
  Copy,
  ExternalLink,
  FileImage,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "./dashboard-layout";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  name: string;
  path: string;
  type: string;
  size: number;
  url: string;
}

interface MediaResponse {
  total: number;
  items: MediaItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MediaLibrary() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  const { data, isLoading } = useQuery<MediaResponse>({
    queryKey: ["/api/admin/media"],
  });

  const filteredItems = data?.items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalSize = data?.items?.reduce((acc, item) => acc + item.size, 0) || 0;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada",
      description: "La URL de la imagen ha sido copiada al portapapeles.",
    });
  };

  return (
    <DashboardLayout
      title="Biblioteca de Medios"
      description="Gestiona las imágenes y archivos multimedia del sitio"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total de imágenes</p>
                  <p className="mt-2 font-display text-2xl font-bold" data-testid="stat-total-images">
                    {data?.total || 0}
                  </p>
                </div>
                <FileImage className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Espacio utilizado</p>
                  <p className="mt-2 font-display text-2xl font-bold" data-testid="stat-storage">
                    {formatFileSize(totalSize)}
                  </p>
                </div>
                <HardDrive className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Formatos soportados</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary">PNG</Badge>
                    <Badge variant="secondary">JPG</Badge>
                    <Badge variant="secondary">WebP</Badge>
                    <Badge variant="secondary">SVG</Badge>
                  </div>
                </div>
                <Image className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar imágenes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imágenes ({filteredItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-2"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className={viewMode === "grid" ? "aspect-square rounded-lg" : "h-16 w-full"} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileImage className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-display text-lg font-semibold">
                  No hay imágenes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Las imágenes aparecerán aquí cuando se agreguen al proyecto
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.name}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                    onClick={() => setSelectedImage(item)}
                    data-testid={`media-item-${item.name}`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-full flex-col items-center justify-center p-2 text-white">
                        <p className="text-xs font-medium truncate w-full text-center">{item.name}</p>
                        <p className="text-xs opacity-75">{formatFileSize(item.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                    data-testid={`media-item-${item.name}`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type.toUpperCase()} • {formatFileSize(item.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.url);
                        }}
                        data-testid={`button-copy-${item.name}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, "_blank");
                        }}
                        data-testid={`button-open-${item.name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <img
                src={selectedImage?.url}
                alt={selectedImage?.name}
                className="w-full object-contain max-h-96"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nombre del archivo</p>
                <p className="font-medium">{selectedImage?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tamaño</p>
                <p className="font-medium">{selectedImage && formatFileSize(selectedImage.size)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{selectedImage?.type.toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-sm">
                    {selectedImage?.url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedImage && copyToClipboard(selectedImage.url)}
                    data-testid="button-copy-url"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
