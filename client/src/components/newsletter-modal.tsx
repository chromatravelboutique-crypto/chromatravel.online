import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrand } from "@/lib/brand-context";
import { Mail, X } from "lucide-react";

const LS_KEY = "newsletter_dismissed";
const DELAY_MS = 30_000;

const schema = z.object({
  nombre:    z.string().min(1, "Tu nombre es requerido"),
  email:     z.string().email("Email inválido"),
  intereses: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

const BASE_INTERESTS = ["Playa", "Aventura", "Lujo", "Grupos", "Bodas"];

export function NewsletterModal() {
  const { brand, isChroma } = useBrand();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const primaryColor = brand?.primaryColor || "#10b981";

  const interestOptions = isChroma
    ? [...BASE_INTERESTS, "Viajes LGBT+ friendly"]
    : BASE_INTERESTS;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { intereses: [] },
  });

  const selectedInterests = watch("intereses") || [];

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(LS_KEY, "1");
    setOpen(false);
  }

  function toggleInterest(interest: string) {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue("intereses", current.filter((i) => i !== interest));
    } else {
      setValue("intereses", [...current, interest]);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSent(true);
      localStorage.setItem(LS_KEY, "1");
      setTimeout(() => setOpen(false), 3000);
    } catch {
      // silently fail — newsletter is optional
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-white/80 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Recibe las mejores ofertas
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-white/85">
            Suscríbete y recibe cada semana nuestras ofertas exclusivas de hoteles con disponibilidad limitada.
          </p>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="py-4 text-center">
              <p className="text-lg font-semibold">¡Listo! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Recibirás nuestras ofertas cada lunes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nl-nombre">Tu nombre</Label>
                <Input id="nl-nombre" placeholder="Ana García" {...register("nombre")} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl-email">Email</Label>
                <Input id="nl-email" type="email" placeholder="tu@email.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">¿Qué tipo de viajes te interesan?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map((interest) => (
                    <label
                      key={interest}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedInterests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                style={{ background: primaryColor }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Suscribiendo..." : "Suscribirme gratis"}
              </Button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                No gracias
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
