import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Calendar,
  Tag,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Check,
  Globe,
  Rss,
  CheckSquare,
  Square,
  EyeOff,
  Upload,
  FileCode,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "./dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BlogPost } from "@shared/schema";

interface Brand {
  id: string;
  code: string;
  name: string;
  domain: string;
}

interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
}

interface ExtendedBlogPost extends BlogPost {
  isMarkdown?: boolean;
}

export default function BlogDashboard() {
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ExtendedBlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ExtendedBlogPost | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedMarkdown, setUploadedMarkdown] = useState<string>("");
  const [uploadFilename, setUploadFilename] = useState<string>("");
  const [parsedFrontmatter, setParsedFrontmatter] = useState<any>(null);
  
  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedPosts(new Set());
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedPosts(new Set());
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setSelectedPosts(new Set());
  };

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: posts, isLoading } = useQuery<ExtendedBlogPost[]>({
    queryKey: ["/api/admin/blog", { brandId: selectedBrand }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog?brandId=${selectedBrand}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const { data: stats } = useQuery<BlogStats>({
    queryKey: ["/api/admin/blog/stats", { brandId: selectedBrand }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/stats?brandId=${selectedBrand}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/blog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/stats"] });
      toast({ title: "Artículo eliminado", description: "El artículo ha sido eliminado correctamente." });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo eliminar el artículo.", 
        variant: "destructive" 
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await apiRequest("PATCH", `/api/admin/blog/${id}`, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/stats"] });
      toast({ title: "Estado actualizado", description: "El estado del artículo ha sido actualizado." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo actualizar el estado.", 
        variant: "destructive" 
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/blog/bulk", { action, ids });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/stats"] });
      setSelectedPosts(new Set());
      setBulkDeleteConfirm(false);
      toast({ title: "Operación completada", description: data.message });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo completar la operación.", 
        variant: "destructive" 
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ content, filename }: { content: string; filename: string }) => {
      const res = await apiRequest("POST", "/api/admin/blog/upload-markdown", { content, filename });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/stats"] });
      setIsUploadDialogOpen(false);
      setUploadedMarkdown("");
      setUploadFilename("");
      setParsedFrontmatter(null);
      toast({ title: "Artículo publicado", description: data.message });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al subir", 
        description: error.message || "No se pudo subir el archivo markdown.", 
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.md')) {
      toast({ title: "Error", description: "Solo se permiten archivos .md", variant: "destructive" });
      return;
    }
    
    const content = await file.text();
    setUploadedMarkdown(content);
    setUploadFilename(file.name);
    
    try {
      const res = await apiRequest("POST", "/api/admin/blog/parse-markdown", { content });
      const data = await res.json();
      setParsedFrontmatter(data);
    } catch (error) {
      setParsedFrontmatter(null);
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadedMarkdown || !parsedFrontmatter?.valid) return;
    uploadMutation.mutate({ content: uploadedMarkdown, filename: uploadFilename });
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  const handleSelectPost = (id: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (selectedPosts.size === 0) return;
    if (action === "delete") {
      setBulkDeleteConfirm(true);
    } else {
      bulkMutation.mutate({ action, ids: Array.from(selectedPosts) });
    }
  };

  const isMarkdownPost = (post: ExtendedBlogPost) => post.isMarkdown || post.id.startsWith('md-');

  const filteredPosts = posts?.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && post.published) ||
      (statusFilter === "draft" && !post.published);
    const matchesBrand = selectedBrand === "all" || post.brandId === selectedBrand;
    return matchesSearch && matchesStatus && matchesBrand;
  }) || [];

  const statsCards = [
    {
      title: "Total de artículos",
      value: stats?.total || filteredPosts.length || 0,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Publicados",
      value: stats?.published || filteredPosts.filter(p => p.published).length || 0,
      icon: Check,
      color: "text-green-500",
    },
    {
      title: "Borradores",
      value: stats?.drafts || filteredPosts.filter(p => !p.published).length || 0,
      icon: Edit,
      color: "text-yellow-500",
    },
    {
      title: "Programados",
      value: stats?.scheduled || 0,
      icon: Calendar,
      color: "text-purple-500",
    },
  ];

  return (
    <DashboardLayout
      title="Gestión de Blog"
      description="Administra artículos y destinos destacados para todas las marcas"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-48" data-testid="select-brand">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Seleccionar marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-1">
              <Rss className="h-3 w-3" />
              RSS activo
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/feed.xml", "_blank")}
              data-testid="button-view-rss"
            >
              <Rss className="mr-2 h-4 w-4" />
              Ver RSS
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(true)} 
              data-testid="button-upload-markdown"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir Markdown
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-post">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Artículo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-2 font-display text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40" data-testid="select-status">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedPosts.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium">
                {selectedPosts.size} artículo(s) seleccionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("publish")}
                  disabled={bulkMutation.isPending}
                  data-testid="button-bulk-publish"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("unpublish")}
                  disabled={bulkMutation.isPending}
                  data-testid="button-bulk-unpublish"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Despublicar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  disabled={bulkMutation.isPending}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPosts(new Set())}
                  data-testid="button-clear-selection"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Destinos Destacados / Blog
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-24 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-display text-lg font-semibold">
                  No hay artículos
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crea tu primer artículo en archivos Markdown en la carpeta /posts
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                  data-testid="button-create-first"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear artículo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleSelectAll}
                        data-testid="button-select-all"
                      >
                        {selectedPosts.size === filteredPosts.length && filteredPosts.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[300px]">Título</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => {
                    const brand = brands?.find(b => b.id === post.brandId);
                    const isMd = isMarkdownPost(post);
                    const isSelected = selectedPosts.has(post.id);
                    return (
                      <TableRow key={post.id} data-testid={`row-post-${post.id}`} className={isSelected ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleSelectPost(post.id)}
                            data-testid={`button-select-${post.id}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="h-12 w-16 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium line-clamp-1">{post.title}</p>
                                {isMd && (
                                  <Badge variant="outline" className="text-xs">
                                    MD
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">/{post.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {brand?.name || "Sin marca"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Tag className="mr-1 h-3 w-3" />
                            {post.category || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isMd ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Publicado
                            </Badge>
                          ) : (
                            <Switch
                              checked={post.published ?? false}
                              onCheckedChange={(checked) =>
                                togglePublishMutation.mutate({ id: post.id, published: checked })
                              }
                              data-testid={`switch-publish-${post.id}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {post.publishedAt
                            ? format(new Date(post.publishedAt), "d MMM yyyy", { locale: es })
                            : post.createdAt 
                              ? format(new Date(post.createdAt), "d MMM yyyy", { locale: es })
                              : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${post.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver artículo
                              </DropdownMenuItem>
                              {!isMd && (
                                <DropdownMenuItem onClick={() => setEditingPost(post)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {isMd && (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar archivo .md
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => window.open(`https://${brand?.domain || 'chromatravel.online'}/blog/${post.slug}`, "_blank")}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver en producción
                              </DropdownMenuItem>
                              {!isMd && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteConfirm(post)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Cómo crear artículos (Método sin código)
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>
                Crea un archivo <code>.md</code> en la carpeta <code>/posts</code> del proyecto
              </li>
              <li>
                Agrega el frontmatter YAML con título, excerpt, imagen y categoría
              </li>
              <li>
                Escribe el contenido en Markdown debajo del frontmatter
              </li>
              <li>
                El artículo aparecerá automáticamente en el blog y RSS
              </li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Consulta el archivo <code>COMO-PUBLICAR.md</code> para más detalles.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar artículo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El artículo "{deleteConfirm?.title}" será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar {selectedPosts.size} artículo(s)?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Los artículos seleccionados serán eliminados permanentemente.
              Los posts en Markdown no serán afectados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkMutation.mutate({ action: "delete", ids: Array.from(selectedPosts) })}
              disabled={bulkMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar {selectedPosts.size} artículo(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BlogFormDialog
        open={isCreateDialogOpen || editingPost !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingPost(null);
        }}
        post={editingPost}
        brands={brands || []}
        selectedBrand={selectedBrand}
      />

      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) {
          setUploadedMarkdown("");
          setUploadFilename("");
          setParsedFrontmatter(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Subir Archivo Markdown
            </DialogTitle>
            <DialogDescription>
              Sube un archivo .md con frontmatter YAML para publicar automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                className="hidden"
                id="markdown-upload"
                data-testid="input-markdown-file"
              />
              <label 
                htmlFor="markdown-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadFilename || "Haz clic para seleccionar un archivo .md"}
                </span>
              </label>
            </div>

            {parsedFrontmatter && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {parsedFrontmatter.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    Datos del Frontmatter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {parsedFrontmatter.frontmatter?.title && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Título:</span>
                      <span>{parsedFrontmatter.frontmatter.title}</span>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.slug && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Slug:</span>
                      <span>{parsedFrontmatter.frontmatter.slug}</span>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.seoTitle && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">SEO Title:</span>
                      <span>{parsedFrontmatter.frontmatter.seoTitle}</span>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.seoDescription && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">SEO Descripción:</span>
                      <span className="truncate max-w-[300px]">{parsedFrontmatter.frontmatter.seoDescription}</span>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.brand && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Marca:</span>
                      <Badge variant="outline">{parsedFrontmatter.frontmatter.brand}</Badge>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.category && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Categoría:</span>
                      <Badge variant="secondary">{parsedFrontmatter.frontmatter.category}</Badge>
                    </div>
                  )}
                  {parsedFrontmatter.frontmatter?.keywords && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="font-medium text-muted-foreground">Keywords:</span>
                      {parsedFrontmatter.frontmatter.keywords.map((k: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  )}
                  {!parsedFrontmatter.valid && (
                    <div className="text-red-500 text-sm mt-2">
                      El archivo debe tener un título en el frontmatter YAML.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!parsedFrontmatter?.valid || uploadMutation.isPending}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar Artículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface BlogFormDialogProps {
  open: boolean;
  onClose: () => void;
  post: ExtendedBlogPost | null;
  brands: Brand[];
  selectedBrand: string;
}

function BlogFormDialog({ open, onClose, post, brands, selectedBrand }: BlogFormDialogProps) {
  const { toast } = useToast();
  const isEditing = post !== null;
  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    image: post?.image || "",
    category: post?.category || "",
    brandId: post?.brandId || (selectedBrand !== "all" ? selectedBrand : ""),
    published: post?.published ?? false,
    seoTitle: post?.seoTitle || "",
    seoDescription: post?.seoDescription || "",
    tags: post?.tags?.join(", ") || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        tags: data.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (isEditing) {
        await apiRequest("PATCH", `/api/admin/blog/${post.id}`, payload);
      } else {
        await apiRequest("POST", "/api/admin/blog", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({
        title: isEditing ? "Artículo actualizado" : "Artículo creado",
        description: isEditing
          ? "Los cambios han sido guardados."
          : "El artículo ha sido creado correctamente.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar el artículo.",
        variant: "destructive",
      });
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del artículo"
              : "Crea un nuevo artículo para el blog. También puedes crear artículos usando archivos Markdown."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value),
                  });
                }}
                placeholder="Título del artículo"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL (slug)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-del-articulo"
                data-testid="input-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Breve descripción del artículo"
                rows={2}
                data-testid="input-excerpt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribe el contenido en Markdown..."
                rows={10}
                className="font-mono text-sm"
                data-testid="input-content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Imagen destacada (URL)</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                data-testid="input-image"
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">Título SEO</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="Título optimizado para buscadores"
                data-testid="input-seo-title"
              />
              <p className="text-xs text-muted-foreground">
                {formData.seoTitle.length}/60 caracteres recomendados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">Meta descripción</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Descripción para resultados de búsqueda"
                rows={3}
                data-testid="input-seo-description"
              />
              <p className="text-xs text-muted-foreground">
                {formData.seoDescription.length}/160 caracteres recomendados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="viajes, lgbt, playa, aventura"
                data-testid="input-tags"
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">Marca</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) => setFormData({ ...formData, brandId: value })}
              >
                <SelectTrigger data-testid="select-post-brand">
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destinos">Destinos Destacados</SelectItem>
                  <SelectItem value="guias">Guías de Viaje</SelectItem>
                  <SelectItem value="experiencias">Experiencias</SelectItem>
                  <SelectItem value="consejos">Consejos</SelectItem>
                  <SelectItem value="noticias">Noticias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="published">Publicar artículo</Label>
                <p className="text-sm text-muted-foreground">
                  Si está activo, el artículo será visible públicamente
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                data-testid="switch-publish-form"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending || !formData.title || !formData.slug}
            data-testid="button-save-post"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear artículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
