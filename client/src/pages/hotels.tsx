import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  ChevronDown,
  X
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SearchWidget } from "@/components/search-widget";
import { HotelCard } from "@/components/hotel-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Hotel } from "@shared/schema";

const amenitiesOptions = [
  { id: "wifi", label: "WiFi gratuito" },
  { id: "pool", label: "Piscina" },
  { id: "spa", label: "Spa" },
  { id: "gym", label: "Gimnasio" },
  { id: "restaurant", label: "Restaurante" },
  { id: "bar", label: "Bar" },
  { id: "parking", label: "Estacionamiento" },
  { id: "breakfast", label: "Desayuno incluido" },
];

type HotelFilters = {
  priceRange: number[];
  lgbtOnly: boolean;
  amenities: string[];
  starRating: number | null;
};

function FilterSidebar({
  filters,
  onFilterChange
}: {
  filters: HotelFilters;
  onFilterChange: (filters: HotelFilters) => void;
}) {
  return (
    <div className="space-y-6">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Rango de precio</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => onFilterChange({ ...filters, priceRange: value })}
              max={1000}
              min={0}
              step={50}
              data-testid="slider-price-range"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${filters.priceRange[0]} USD</span>
              <span>${filters.priceRange[1]}+ USD</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Certificación LGBT+</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lgbtOnly"
              checked={filters.lgbtOnly}
              onCheckedChange={(checked) => 
                onFilterChange({ ...filters, lgbtOnly: checked as boolean })
              }
              data-testid="checkbox-lgbt-only"
            />
            <Label htmlFor="lgbtOnly" className="text-sm">
              Solo hoteles verificados LGBT+
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Estrellas</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {[3, 4, 5].map((stars) => (
              <Button
                key={stars}
                variant={filters.starRating === stars ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  onFilterChange({ 
                    ...filters, 
                    starRating: filters.starRating === stars ? null : stars 
                  })
                }
                data-testid={`button-stars-${stars}`}
              >
                {stars} estrellas
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Amenidades</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-3">
            {amenitiesOptions.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={filters.amenities.includes(amenity.id)}
                  onCheckedChange={(checked) => {
                    const newAmenities = checked
                      ? [...filters.amenities, amenity.id]
                      : filters.amenities.filter((a) => a !== amenity.id);
                    onFilterChange({ ...filters, amenities: newAmenities });
                  }}
                  data-testid={`checkbox-amenity-${amenity.id}`}
                />
                <Label htmlFor={amenity.id} className="text-sm">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function HotelSkeleton() {
  return (
    <Card className="flex flex-col md:flex-row">
      <Skeleton className="aspect-[4/3] md:w-72 lg:w-80" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </Card>
  );
}

export default function Hotels() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    lgbtOnly: false,
    amenities: [] as string[],
    starRating: null as number | null,
  });

  const { data: hotels, isLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels", searchParams.toString()],
  });

  const activeFiltersCount = 
    (filters.lgbtOnly ? 1 : 0) + 
    (filters.starRating ? 1 : 0) + 
    filters.amenities.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0);

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      lgbtOnly: false,
      amenities: [],
      starRating: null,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <SearchWidget variant="inline" />
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">
                  {searchParams.get("destination") 
                    ? `Hoteles en ${searchParams.get("destination")}`
                    : "Todos los hoteles"}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {isLoading 
                    ? "Buscando hoteles..." 
                    : `${hotels?.length || 0} hoteles encontrados`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 lg:hidden" data-testid="button-mobile-filters">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar filters={filters} onFilterChange={setFilters} />
                    </div>
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={clearFilters}>
                        Limpiar
                      </Button>
                      <Button className="flex-1">Aplicar</Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recomendados</SelectItem>
                    <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor calificados</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden items-center gap-1 rounded-lg border p-1 sm:flex">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {filters.lgbtOnly && (
                  <Badge variant="secondary" className="gap-1">
                    LGBT+ Verificado
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, lgbtOnly: false })}
                    />
                  </Badge>
                )}
                {filters.starRating && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.starRating} estrellas
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, starRating: null })}
                    />
                  </Badge>
                )}
                {filters.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="gap-1">
                    {amenitiesOptions.find((a) => a.id === amenity)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ 
                        ...filters, 
                        amenities: filters.amenities.filter((a) => a !== amenity) 
                      })}
                    />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  Limpiar todos
                </Button>
              </div>
            )}

            <div className="flex gap-8">
              <aside className="hidden w-64 shrink-0 lg:block">
                <Card className="sticky top-24 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-medium">Filtros</h2>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <FilterSidebar filters={filters} onFilterChange={setFilters} />
                </Card>
              </aside>

              <div className="flex-1">
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <HotelSkeleton key={i} />
                    ))}
                  </div>
                ) : hotels && hotels.length > 0 ? (
                  <div className={
                    viewMode === "grid" 
                      ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-6"
                  }>
                    {hotels.map((hotel) => (
                      <HotelCard 
                        key={hotel.id} 
                        hotel={hotel} 
                        variant={viewMode}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="font-display text-lg font-semibold">
                      No encontramos hoteles
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Intenta ajustar los filtros o buscar en otro destino.
                    </p>
                    <Button className="mt-4" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
