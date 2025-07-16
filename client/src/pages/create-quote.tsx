import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuoteItem from "@/components/quote-item";

const clientSchema = z.object({
  companyName: z.string().min(1, "Nazwa firmy jest wymagana"),
  nip: z.string().optional(),
  contactPerson: z.string().min(1, "Osoba kontaktowa jest wymagana"),
  phone: z.string().min(1, "Telefon jest wymagany"),
  email: z.string().email("Nieprawidłowy format email"),
  address: z.string().min(1, "Adres jest wymagany"),
});

interface QuoteItemData {
  id: string;
  equipmentId: number;
  quantity: number;
  rentalPeriodDays: number;
  pricePerDay: number;
  discountPercent: number;
  totalPrice: number;
  notes?: string;
  // Fuel cost fields for generators
  fuelConsumptionLH?: number;
  fuelPricePerLiter?: number;
  hoursPerDay?: number;
  totalFuelCost?: number;
  includeFuelCost?: boolean;

  // Installation cost fields
  includeInstallationCost?: boolean;
  installationDistanceKm?: number;
  numberOfTechnicians?: number;
  serviceRatePerTechnician?: number;
  travelRatePerKm?: number;
  totalInstallationCost?: number;
}

interface Equipment {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  pricing: Array<{
    periodStart: number;
    periodEnd?: number;
    pricePerDay: string;
    discountPercent: string;
  }>;
  fuelConsumption75?: number; // l/h at 75% load for generators
}

export default function CreateQuote() {
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get equipment ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentIdFromUrl = urlParams.get('equipment');

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });
  
  // Auto-add equipment when coming from equipment page
  useEffect(() => {
    if (equipmentIdFromUrl && equipment.length > 0 && quoteItems.length === 0) {
      const selectedEquipment = equipment.find(eq => eq.id === parseInt(equipmentIdFromUrl));
      if (selectedEquipment) {
        console.log('Auto-adding equipment:', selectedEquipment.name);
        const newItem: QuoteItemData = {
          id: Date.now().toString(),
          equipmentId: selectedEquipment.id,
          quantity: 1,
          rentalPeriodDays: 1,
          pricePerDay: 0,
          discountPercent: 0,
          totalPrice: 0,
          notes: "",
          fuelConsumptionLH: selectedEquipment.fuelConsumption75 || 0,
          fuelPricePerLiter: 6.50, // Default fuel price
          hoursPerDay: 8,
          totalFuelCost: 0,
          includeFuelCost: selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe',
          includeInstallationCost: false,
          installationDistanceKm: 0,
          numberOfTechnicians: 1,
          serviceRatePerTechnician: 150,
          travelRatePerKm: 1.15,
          totalInstallationCost: 0
        };
        setQuoteItems([newItem]);
        
        // Remove equipment param from URL after a delay to ensure state is updated
        setTimeout(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 100);
      }
    }
  }, [equipmentIdFromUrl, equipment, quoteItems.length]);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: "",
      nip: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: z.infer<typeof clientSchema>) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const response = await apiRequest("POST", "/api/quotes", quoteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Sukces",
        description: "Wycena została utworzona pomyślnie",
      });
      // Reset form
      form.reset();
      setQuoteItems([]);
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć wyceny",
        variant: "destructive",
      });
    },
  });

  const addQuoteItem = () => {
    const newItem: QuoteItemData = {
      id: Date.now().toString(),
      equipmentId: 0,
      quantity: 1,
      rentalPeriodDays: 1,
      pricePerDay: 0,
      discountPercent: 0,
      totalPrice: 0,
      notes: "",
      fuelConsumptionLH: 0,
      fuelPricePerLiter: 6.50,
      hoursPerDay: 8,
      totalFuelCost: 0,
      includeFuelCost: false,

      includeInstallationCost: false,
      installationDistanceKm: 0,
      numberOfTechnicians: 1,
      serviceRatePerTechnician: 150,
      travelRatePerKm: 1.15,
      totalInstallationCost: 0
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const removeQuoteItem = (id: string) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter(item => item.id !== id));
    }
  };

  const updateQuoteItem = (id: string, updatedItem: QuoteItemData) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? updatedItem : item
    ));
  };

  const calculateTotals = () => {
    const totalNet = quoteItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const vatAmount = totalNet * 0.23;
    const totalGross = totalNet + vatAmount;
    
    return {
      totalNet,
      vatAmount,
      totalGross,
    };
  };

  const { totalNet, vatAmount, totalGross } = calculateTotals();

  const onSubmit = async (clientData: z.infer<typeof clientSchema>) => {
    if (quoteItems.length === 0) {
      toast({
        title: "Błąd",
        description: "Dodaj przynajmniej jedną pozycję do wyceny",
        variant: "destructive",
      });
      return;
    }

    if (quoteItems.some(item => item.equipmentId === 0)) {
      toast({
        title: "Błąd",
        description: "Wszystkie pozycje muszą mieć wybrany sprzęt",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create client
      const client = await createClientMutation.mutateAsync(clientData);
      
      // Create quote
      const quoteData = {
        clientId: client.id,
        status: "draft",
        totalNet: totalNet.toString(),
        vatRate: "23",
        totalGross: totalGross.toString(),
        notes: "",
      };

      await createQuoteMutation.mutateAsync(quoteData);
    } catch (error) {
      console.error("Error creating quote:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) {
      return "0,00 zł";
    }
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Tworzenie Nowej Wyceny</h1>
          <p className="text-muted-foreground mt-2">Wypełnij poniższe informacje, aby utworzyć nową wycenę dla klienta</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informacje o kliencie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwa firmy</FormLabel>
                        <FormControl>
                          <Input placeholder="Wprowadź nazwę firmy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIP</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-78-90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Osoba kontaktowa</FormLabel>
                        <FormControl>
                          <Input placeholder="Imię i nazwisko" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="+48 123 456 789" {...field} />
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
                          <Input placeholder="email@firma.pl" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Input placeholder="Ulica, miasto, kod pocztowy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pozycje wyceny</CardTitle>
                  <Button type="button" onClick={addQuoteItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj pozycję
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quoteItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Brak pozycji w wycenie</p>
                      <Button type="button" onClick={addQuoteItem} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj pierwszą pozycję
                      </Button>
                    </div>
                  ) : (
                    quoteItems.map((item) => (
                      <QuoteItem
                        key={item.id}
                        item={item}
                        equipment={equipment}
                        onUpdate={(updatedItem) => updateQuoteItem(item.id, updatedItem)}
                        onRemove={() => removeQuoteItem(item.id)}
                        canRemove={quoteItems.length > 1}
                      />
                    ))
                  )}
                </div>

                {/* Summary */}
                {quoteItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Wartość netto:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totalNet)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">VAT (23%):</span>
                        <span className="text-sm text-gray-600">{formatCurrency(vatAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Wartość brutto:</span>
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(totalGross)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Anuluj
              </Button>
              <Button type="button" variant="secondary">
                <Save className="w-4 h-4 mr-2" />
                Zapisz jako wersję roboczą
              </Button>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending || createQuoteMutation.isPending}
              >
                <FileText className="w-4 h-4 mr-2" />
                {createClientMutation.isPending || createQuoteMutation.isPending 
                  ? "Tworzenie..." 
                  : "Utwórz wycenę"
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
