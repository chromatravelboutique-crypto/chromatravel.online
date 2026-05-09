import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "./dashboard-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Destination, Brand } from "@shared/schema";

const destinationSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  country: z.string().min(2, "País requerido"),
  shortDescription: z.string().min(10, "Descripción corta requerida"),
  description: z.string().optional(),
  image: z.string().url("URL de imagen válida").optional().or(z.literal("")),
  lgbtFriendlyScore: z.number().min(1).max(10).optional(),
  featured: z.boolean().default(false),
  brandId: z.string().optional(),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

export default function ProductsManagement() {
  const [activeTab, setActiveTab] = useState("destinations");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Destination | null>(null);
  const { toast } = useToast();

  const { data: destinations = [], isLoading: loadingDestinations } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const form = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: "",
      country: "",
      shortDescription: "",
      description: "",
      image: "",
      lgbtFriendlyScore: 5,
      featured: false,
      brandId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DestinationFormData) => {
      return apiRequest("POST", "/api/destinations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({ title: "Destino creado correctamente" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error al crear destino", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DestinationFormData }) => {
      return apiRequest("PATCH", `/api/destinations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({ title: "Destino actualizado correctamente" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error al actualizar destino", variant: "destructive" });
    },
  });

  const handleEdit = (destination: Destination) => {
    setEditingItem(destination);
    form.reset({
      name: destination.name,
      country: destination.country,
      shortDescription: destination.shortDescription || "",
      description: destination.description || "",
      image: destination.image || "",
      lgbtFriendlyScore: destination.lgbtFriendlyScore || 5,
      featured: destination.featured || false,
      brandId: destination.brandId || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: DestinationFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getBrandName = (brandId: string | null) => {
    if (!brandId) return "Todas las marcas";
    const brand = brands.find((b) => b.id === brandId);
    return brand?.name || "Desconocida";
  };

  return (
    <DashboardLayout
      title="Gestión de Productos"
      description="Administra destinos, hoteles y contenido por marca"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <TabsList data-testid="tabs-products">
            <TabsTrigger value="destinations" data-testid="tab-destinations">
              Destinos
            </TabsTrigger>
            <TabsTrigger value="hotels" data-testid="tab-hotels">
              Hoteles
            </TabsTrigger>
            <TabsTrigger value="blog" data-testid="tab-blog">
              Blog
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingItem(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Agregar {activeTab === "destinations" ? "Destino" : activeTab === "hotels" ? "Hotel" : "Post"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar" : "Nuevo"} Destino
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-brand">
                              <SelectValue placeholder="Seleccionar marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todas las marcas</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Barcelona" data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: España" data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción corta</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Para tarjetas y previews" data-testid="input-short-desc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción completa</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descripción detallada" data-testid="input-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de imagen</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." data-testid="input-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lgbtFriendlyScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puntuación LGBT-friendly (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-lgbt-score" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel>Destacado</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-product"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editingItem
                      ? "Actualizar"
                      : "Crear"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="destinations">
          {loadingDestinations ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-muted rounded mb-3" />
                    <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : destinations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay destinos registrados</p>
                <p className="text-sm">Haz clic en "Agregar Destino" para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((destination) => (
                <Card key={destination.id} className="overflow-hidden" data-testid={`card-destination-${destination.id}`}>
                  {destination.image && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold">{destination.name}</h3>
                        <p className="text-sm text-muted-foreground">{destination.country}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(destination)}
                          data-testid={`button-edit-${destination.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {destination.shortDescription}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getBrandName(destination.brandId)}
                      </Badge>
                      {destination.featured && (
                        <Badge className="text-xs">Destacado</Badge>
                      )}
                      {destination.lgbtFriendlyScore && destination.lgbtFriendlyScore >= 7 && (
                        <Badge variant="outline" className="text-xs">
                          LGBT+ {destination.lgbtFriendlyScore}/10
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hotels">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Gestión de hoteles disponible próximamente</p>
              <p className="text-sm">Los hoteles se integran automáticamente desde Hotelbeds</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Gestión de blog disponible próximamente</p>
              <p className="text-sm">El contenido del blog se publica automáticamente en RSS</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
