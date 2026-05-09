import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const leadFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  destination: z.string().optional(),
  travelDates: z.string().optional(),
  message: z.string().optional(),
  marketingConsent: z.boolean().default(false),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  variant?: "card" | "inline";
  title?: string;
  description?: string;
}

export function LeadForm({
  variant = "card",
  title = "Solicita información",
  description = "Cuéntanos sobre tu viaje ideal y un asesor te contactará pronto.",
}: LeadFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      destination: "",
      travelDates: "",
      message: "",
      marketingConsent: false,
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Solicitud enviada",
          description: "Un asesor te contactará pronto.",
        });
      } else {
        throw new Error("Error al enviar");
      }
    } catch {
      toast({
        title: "Error",
        description: "No pudimos enviar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mb-2 font-display text-xl font-semibold">
            ¡Gracias por contactarnos!
          </h3>
          <p className="text-muted-foreground">
            Un asesor te contactará pronto para ayudarte a planear tu viaje ideal.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="https://wa.me/524434044104"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
            <Button onClick={() => setIsSubmitted(false)} data-testid="button-new-request">
              Nueva solicitud
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} data-testid="input-lead-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    {...field}
                    data-testid="input-lead-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="+52 55 1234 5678" {...field} data-testid="input-lead-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino de interés</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-lead-destination">
                      <SelectValue placeholder="Selecciona un destino" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="barcelona">Barcelona, España</SelectItem>
                    <SelectItem value="puerto-vallarta">Puerto Vallarta, México</SelectItem>
                    <SelectItem value="amsterdam">Ámsterdam, Países Bajos</SelectItem>
                    <SelectItem value="mykonos">Mykonos, Grecia</SelectItem>
                    <SelectItem value="other">Otro destino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="travelDates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fechas aproximadas de viaje</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Del 15 al 22 de marzo 2025"
                  {...field}
                  data-testid="input-lead-dates"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuéntanos sobre tu viaje ideal</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="¿Qué tipo de experiencia buscas? ¿Tienes preferencias especiales?"
                  className="min-h-[100px]"
                  {...field}
                  data-testid="textarea-lead-message"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marketingConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-lead-consent"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal text-muted-foreground">
                  Acepto recibir ofertas y novedades por email
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full gap-2" disabled={form.formState.isSubmitting} data-testid="button-lead-submit">
          {form.formState.isSubmitting ? (
            "Enviando..."
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar solicitud
            </>
          )}
        </Button>
      </form>
    </Form>
  );

  if (variant === "inline") {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
