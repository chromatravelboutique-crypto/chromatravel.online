import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Share2,
  TrendingUp,
  Eye,
  MousePointer,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { DashboardLayout } from "./dashboard-layout";
import { useAuth } from "@/lib/auth";
import type { BlogPost, Lead } from "@shared/schema";

interface PendingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  socialExcerpt: string;
  hashtags: string[];
  image: string;
  publishedAt: string;
  networks: {
    name: string;
    url: string;
    formattedPost: string;
  }[];
}

interface AutomationResponse {
  brand: string;
  domain: string;
  count: number;
  posts: PendingPost[];
}

export default function MarketingDashboard() {
  const { user } = useAuth();

  const { data: blogPosts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const { data: pendingPosts, isLoading: automationLoading } = useQuery<AutomationResponse>({
    queryKey: ["/api/automation/pending-posts"],
  });

  const publishedPosts = blogPosts?.filter(p => p.published) || [];
  const draftPosts = blogPosts?.filter(p => !p.published) || [];
  const socialLeads = leads?.filter(l => l.source?.includes("social")) || [];

  const statsCards = [
    {
      title: "Posts publicados",
      value: publishedPosts.length.toString(),
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Borradores",
      value: draftPosts.length.toString(),
      icon: FileText,
      color: "text-gray-500",
    },
    {
      title: "Pendientes social",
      value: pendingPosts?.count?.toString() || "0",
      icon: Share2,
      color: "text-purple-500",
    },
    {
      title: "Leads de social",
      value: socialLeads.length.toString(),
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  return (
    <DashboardLayout 
      title={`Hola, ${user?.firstName}`}
      description="Panel de Marketing - Contenido y redes sociales"
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 font-display text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Posts listos para redes</CardTitle>
            <Link href="/dashboard/social">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {automationLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : pendingPosts?.posts && pendingPosts.posts.length > 0 ? (
              <div className="space-y-4">
                {pendingPosts.posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">{post.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {post.socialExcerpt || post.excerpt}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.hashtags?.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.networks?.map((network) => (
                        <Button
                          key={network.name}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          {network.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay posts pendientes para redes
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Blog posts recientes</CardTitle>
            <Link href="/dashboard/blog">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : publishedPosts.length > 0 ? (
              <div className="space-y-4">
                {publishedPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {post.publishedAt && format(new Date(post.publishedAt), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Publicado" : "Borrador"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay blog posts todavía
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Performance de contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasa de publicación</span>
                  <span className="text-sm font-medium">
                    {publishedPosts.length}/{(publishedPosts.length + draftPosts.length) || 1 * 100}%
                  </span>
                </div>
                <Progress 
                  value={blogPosts?.length ? (publishedPosts.length / blogPosts.length) * 100 : 0} 
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Leads de redes sociales</span>
                  <span className="text-sm font-medium">
                    {socialLeads.length} leads
                  </span>
                </div>
                <Progress 
                  value={leads?.length ? (socialLeads.length / leads.length) * 100 : 0} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
