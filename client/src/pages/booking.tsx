import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CreditCard, Lock, Check, Loader2 } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { BookingSteps } from "@/components/booking-steps";
import { BookingSummary } from "@/components/booking-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Rate, Room, Hotel, Booking } from "@shared/schema";

import hotelImage from "@assets/generated_images/luxury_boutique_hotel_dusk.png";

const guestFormSchema = z.object({
  firstName: z.string().min(2, "El nombre es requerido"),
  lastName: z.string().min(2, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  emailConfirm: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono inválido"),
  country: z.string().min(1, "Selecciona un país"),
  specialRequests: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.email === data.emailConfirm, {
  message: "Los emails no coinciden",
  path: ["emailConfirm"],
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

const paymentFormSchema = z.object({
  cardNumber: z.string().min(16, "Número de tarjeta inválido"),
  cardName: z.string().min(2, "Nombre del titular requerido"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Formato inválido (MM/YY)"),
  cvv: z.string().min(3, "CVV inválido").max(4),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type RoomWithRates = Room & { rates: Rate[] };
type HotelWithRooms = Hotel & { rooms: RoomWithRates[] };

export default function Booking() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [guestData, setGuestData] = useState<GuestFormValues | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const rateId = searchParams.get("rateId");
  const checkInStr = searchParams.get("checkIn") || format(new Date(), "yyyy-MM-dd");
  const checkOutStr = searchParams.get("checkOut") || format(new Date(), "yyyy-MM-dd");
  const guests = parseInt(searchParams.get("guests") || "2");
  
  const checkIn = parseISO(checkInStr);
  const checkOut = parseISO(checkOutStr);
  const nights = differenceInDays(checkOut, checkIn) || 1;

  const { data: hotelData, isLoading: hotelLoading } = useQuery<HotelWithRooms>({
    queryKey: ["/api/hotels", hotelId],
    enabled: !!hotelId,
  });

  const { data: rateData, isLoading: rateLoading } = useQuery<Rate>({
    queryKey: ["/api/rates", rateId],
    enabled: !!rateId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: {
      hotelId: string;
      roomId: string;
      rateId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      guestFirstName: string;
      guestLastName: string;
      guestEmail: string;
      guestPhone: string;
      specialRequests?: string;
      totalPrice: string;
      currency: string;
      status: string;
      paymentStatus: string;
    }) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json() as Promise<Booking>;
    },
    onSuccess: (booking) => {
      setConfirmedBooking(booking);
      toast({
        title: "Reserva confirmada",
        description: "Te hemos enviado un correo con los detalles de tu reserva.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al crear la reserva",
        description: "Por favor, intenta de nuevo o contacta a soporte.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const guestForm = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      emailConfirm: "",
      phone: "",
      country: "",
      specialRequests: "",
      termsAccepted: false,
      marketingConsent: false,
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiry: "",
      cvv: "",
    },
  });

  const onGuestSubmit = (data: GuestFormValues) => {
    setGuestData(data);
    setCurrentStep(3);
  };

  const onPaymentSubmit = async (data: PaymentFormValues) => {
    if (!guestData || !rateData || !hotelId || !rateId) return;
    
    setIsProcessing(true);
    
    const totalPrice = (Number(rateData.price) * nights).toFixed(2);
    
    createBookingMutation.mutate({
      hotelId: hotelId,
      roomId: rateData.roomId,
      rateId: rateId,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests: guests,
      guestFirstName: guestData.firstName,
      guestLastName: guestData.lastName,
      guestEmail: guestData.email,
      guestPhone: guestData.phone,
      specialRequests: guestData.specialRequests || undefined,
      totalPrice: totalPrice,
      currency: rateData.currency || "USD",
      status: "confirmed",
      paymentStatus: "paid",
    });
  };

  const isLoading = hotelLoading || rateLoading;

  const hotel = hotelData;
  const rate = rateData;
  const room = hotel?.rooms?.find(r => r.id === rate?.roomId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Skeleton className="mb-6 h-10 w-48" />
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex-1">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="w-full lg:w-96">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hotel || !rate || !room) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex flex-1 items-center justify-center py-12">
          <Card className="mx-auto max-w-lg text-center">
            <CardContent className="py-12">
              <h1 className="mb-4 font-display text-2xl font-bold">
                Información no disponible
              </h1>
              <p className="mb-6 text-muted-foreground">
                No pudimos encontrar la información de la reserva. Por favor, vuelve a seleccionar tu habitación.
              </p>
              <Link href={hotelId ? `/hotels/${hotelId}` : "/hotels"}>
                <Button>Volver al hotel</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex flex-1 items-center justify-center py-12">
          <Card className="mx-auto max-w-lg text-center">
            <CardContent className="py-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mb-2 font-display text-2xl font-bold">
                ¡Reserva confirmada!
              </h1>
              <p className="mb-6 text-muted-foreground">
                Tu reserva en {hotel.name} ha sido confirmada. Hemos enviado
                los detalles a tu correo electrónico.
              </p>
              <div className="mb-8 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  Código de confirmación
                </p>
                <p className="font-display text-2xl font-bold text-primary" data-testid="text-confirmation-code">
                  {confirmedBooking.confirmationCode}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/">
                  <Button variant="outline">Volver al inicio</Button>
                </Link>
                <Link href="/hotels">
                  <Button>Buscar más hoteles</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPrice = Number(rate.price) * nights;

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-6">
            <Link href={`/hotels/${hotelId}`}>
              <Button variant="ghost" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Volver al hotel
              </Button>
            </Link>
          </div>

          <div className="mx-auto max-w-4xl">
            <BookingSteps currentStep={currentStep} />
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Confirma tu selección</CardTitle>
                    <CardDescription>
                      Revisa los detalles de tu reserva antes de continuar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <img
                        src={hotel.thumbnail || hotelImage}
                        alt={hotel.name}
                        className="h-24 w-32 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-display font-semibold">{hotel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {hotel.city}, {hotel.country}
                        </p>
                        <p className="mt-2 text-sm">{room.name}</p>
                        <p className="text-sm text-muted-foreground">{rate.name}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">
                          {format(checkIn, "EEE, d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-medium">
                          {format(checkOut, "EEE, d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Huéspedes</p>
                        <p className="font-medium">{guests} huéspedes</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          ${Number(rate.price).toLocaleString()} x {nights} noches
                        </span>
                        <span>${totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${totalPrice.toLocaleString()} {rate.currency}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-continue-step1"
                    >
                      Continuar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Información del huésped</CardTitle>
                    <CardDescription>
                      Ingresa los datos del huésped principal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...guestForm}>
                      <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={guestForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu nombre" {...field} data-testid="input-firstname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Apellido</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tu apellido" {...field} data-testid="input-lastname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={guestForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="tu@email.com" {...field} data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="emailConfirm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Repite tu email" {...field} data-testid="input-email-confirm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={guestForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input placeholder="+52 55 1234 5678" {...field} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>País de residencia</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-country">
                                      <SelectValue placeholder="Selecciona tu país" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mx">México</SelectItem>
                                    <SelectItem value="us">Estados Unidos</SelectItem>
                                    <SelectItem value="es">España</SelectItem>
                                    <SelectItem value="ar">Argentina</SelectItem>
                                    <SelectItem value="co">Colombia</SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={guestForm.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peticiones especiales (opcional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Cama king-size, habitación alta, llegada tardía..."
                                  className="min-h-[100px]"
                                  {...field}
                                  data-testid="textarea-requests"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator />

                        <FormField
                          control={guestForm.control}
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-terms"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Acepto los{" "}
                                  <Link href="/terms" className="text-primary underline">
                                    términos y condiciones
                                  </Link>{" "}
                                  y la{" "}
                                  <Link href="/privacy" className="text-primary underline">
                                    política de privacidad
                                  </Link>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={guestForm.control}
                          name="marketingConsent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-marketing"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-muted-foreground">
                                  Quiero recibir ofertas exclusivas y novedades por email
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            data-testid="button-back-step2"
                          >
                            Atrás
                          </Button>
                          <Button type="submit" className="flex-1" data-testid="button-continue-step2">
                            Continuar al pago
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <Lock className="h-5 w-5" />
                      Pago seguro
                    </CardTitle>
                    <CardDescription>
                      Tu información está protegida con encriptación SSL
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                        <FormField
                          control={paymentForm.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de tarjeta</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="1234 5678 9012 3456"
                                    {...field}
                                    data-testid="input-card-number"
                                  />
                                  <CreditCard className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="cardName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del titular</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Como aparece en la tarjeta"
                                  {...field}
                                  data-testid="input-card-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={paymentForm.control}
                            name="expiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de expiración</FormLabel>
                                <FormControl>
                                  <Input placeholder="MM/YY" {...field} data-testid="input-card-expiry" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentForm.control}
                            name="cvv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVV</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="123"
                                    maxLength={4}
                                    {...field}
                                    data-testid="input-card-cvv"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="rounded-lg bg-muted p-4">
                          <div className="flex justify-between text-sm">
                            <span>Total a pagar</span>
                            <span className="font-semibold">
                              ${totalPrice.toLocaleString()} {rate.currency}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                            disabled={isProcessing}
                            data-testid="button-back-step3"
                          >
                            Atrás
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1" 
                            disabled={isProcessing}
                            data-testid="button-confirm-payment"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              "Confirmar y pagar"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>

            <aside className="w-full lg:w-96">
              <BookingSummary
                hotelName={hotel.name}
                hotelCity={hotel.city}
                hotelCountry={hotel.country}
                hotelImage={hotel.thumbnail || hotelImage}
                roomName={room.name}
                rateName={rate.name}
                checkIn={checkIn}
                checkOut={checkOut}
                nights={nights}
                guests={guests}
                pricePerNight={Number(rate.price)}
                totalPrice={totalPrice}
                currency={rate.currency || "USD"}
                mealPlan={rate.mealPlan || undefined}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
