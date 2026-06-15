import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Eye, Save, Loader2, CheckCircle2, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/pages/dashboard/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  topic: z.string().min(5, "Escribe un tema más descriptivo"),
  keywords: z.string().min(1, "Agrega al menos una keyword"),
  brandCode: z.string(),
  whatsappNumber: z.string().optional(),
  targetLength: z.coerce.number().min(500).max(3000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface GeneratedPost {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  tags: string[];
  excerpt: string;
}

export default function AdminBlogGenerator() {
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [published, setPublished] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { brandCode: "chroma", targetLength: 1100 },
  });

  const brandCode = watch("brandCode");

  const generateMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const keywords = data.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      return apiRequest("POST", "/api/admin/blog/generate", {
        topic: data.topic,
        keywords,
        brandCode: data.brandCode,
        whatsappNumber: data.whatsappNumber,
        targetLength: data.targetLength,
      });
    },
    onSuccess: (data: any) => {
      setGeneratedPost(data);
      setPublished(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!generatedPost) throw new Error("No hay post generado");
      return apiRequest("POST", "/api/admin/blog/publish", {
        slug: generatedPost.slug,
        title: generatedPost.title,
        content: generatedPost.content,
        metaDescription: generatedPost.metaDescription,
        tags: generatedPost.tags,
        brandCode,
      });
    },
    onSuccess: () => setPublished(true),
  });

  const onSubmit = (data: FormValues) => generateMutation.mutate(data);

  return (
    <DashboardLayout
      title="Generador de Blog con IA"
      description="Crea artículos SEO optimizados automáticamente"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Configuración del artículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="topic">Tema del artículo *</Label>
                  <Textarea
                    id="topic"
                    rows={3}
                    placeholder="Ej. Los mejores hoteles LGBT+ friendly en Cancún para 2026"
                    {...register("topic")}
                  />
                  {errors.topic && <p className="text-xs text-destructive">{errors.topic.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="keywords">
                    <Tags className="inline h-3.5 w-3.5 mr-1" />
                    Keywords (separadas por coma) *
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="viaje LGBT, Cancún gay friendly, hotel inclusivo"
                    {...register("keywords")}
                  />
                  {errors.keywords && <p className="text-xs text-destructive">{errors.keywords.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Marca</Label>
                  <Select value={brandCode} onValueChange={(v) => setValue("brandCode", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chroma">Chroma Travel</SelectItem>
                      <SelectItem value="fenix">Fénix Traveler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="targetLength">Longitud objetivo (palabras)</Label>
                  <Input id="targetLength" type="number" min={500} max={3000} {...register("targetLength")} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="whatsappNumber">WhatsApp (opcional)</Label>
                  <Input id="whatsappNumber" placeholder="524434044104" {...register("whatsappNumber")} />
                </div>

                <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generar con IA
                    </>
                  )}
                </Button>

                {generateMutation.isError && (
                  <p className="text-xs text-destructive">
                    Error al generar. Intenta de nuevo.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {generatedPost && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Slug</p>
                  <p className="font-mono text-xs break-all">{generatedPost.slug}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Meta description</p>
                  <p className="text-xs">{generatedPost.metaDescription}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPost.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>

                {published ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Publicado en posts/{generatedPost.slug}.md
                  </div>
                ) : (
                  <Button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="w-full"
                    variant="default"
                  >
                    {publishMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publicando...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" />Publicar artículo</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          {generateMutation.isPending ? (
            <Card className="h-full">
              <CardContent className="flex h-96 items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 h-10 w-10 animate-pulse" />
                  <p>La IA está redactando tu artículo...</p>
                  <p className="text-xs mt-1">Esto puede tomar 15-30 segundos</p>
                </div>
              </CardContent>
            </Card>
          ) : generatedPost ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Vista previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList className="mb-4">
                    <TabsTrigger value="preview">Vista previa</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview">
                    <div className="max-h-[600px] overflow-y-auto space-y-2">
                      {generatedPost.content.split("\n").map((line, i) => {
                        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-4">{line.slice(2)}</h1>;
                        if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-3">{line.slice(3)}</h2>;
                        if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-2">{line.slice(4)}</h3>;
                        if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>;
                        if (line.trim() === "") return <div key={i} className="h-2" />;
                        return <p key={i} className="text-sm leading-relaxed">{line}</p>;
                      })}
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown">
                    <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap text-xs font-mono bg-muted rounded p-4">
                      {generatedPost.content}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex h-96 items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p>El artículo generado aparecerá aquí.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
