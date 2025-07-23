import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  Users,
  Wrench,
  DollarSign,
  UserCheck,
  UserX,
  Shield,
  AlertTriangle,
  Copy
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import EquipmentAdditionalManager from "@/components/equipment-additional-manager";

interface Equipment {
  id: number;
  name: string;
  description?: string;
  model?: string;
  power?: string;
  quantity: number;
  availableQuantity: number;
  // Technical specifications for generators
  fuelConsumption75?: number;
  dimensions?: string;
  weight?: string;
  engine?: string;
  alternator?: string;
  fuelTankCapacity?: number;

  category: {
    id: number;
    name: string;
  };
  pricing: Array<{
    id: number;
    period: string;
    pricePerDay: number;
    discountPercent: number;
  }>;
  additionalEquipment: Array<{
    id: number;
    type: string;
    description: string;
    pricePerDay: number;
  }>;
}

// Nowy komponent dla zarządzania equipment-specific maintenance defaults  
function EquipmentMaintenanceDefaultsCard({ equipment }: { equipment: Equipment[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Filtruj tylko urządzenia z kategoriami które mają maintenance costs
  const equipmentWithMaintenance = equipment.filter(item => 
    item.category && ['Agregaty prądotwórcze', 'Maszty oświetleniowe', 'Klimatyzacje'].includes(item.category.name)
  );

  // Query do pobierania maintenance defaults dla wybranego urządzenia
  const { data: maintenanceDefaults, isLoading } = useQuery({
    queryKey: ["/api/equipment", selectedEquipment?.id, "maintenance-defaults"],
    enabled: !!selectedEquipment?.id,
    retry: false,
  });

  // Schema walidacji dla equipment-specific maintenance defaults
  const equipmentMaintenanceSchema = z.object({
    fuelFilter1Name: z.string().min(1, "Nazwa jest wymagana"),
    fuelFilter1Cost: z.string().min(1, "Koszt jest wymagany"),
    fuelFilter2Name: z.string().min(1, "Nazwa jest wymagana"),
    fuelFilter2Cost: z.string().min(1, "Koszt jest wymagany"),
    oilFilterName: z.string().min(1, "Nazwa jest wymagana"),
    oilFilterCost: z.string().min(1, "Koszt jest wymagany"),
    airFilter1Name: z.string().min(1, "Nazwa jest wymagana"),
    airFilter1Cost: z.string().min(1, "Koszt jest wymagany"),
    airFilter2Name: z.string().min(1, "Nazwa jest wymagana"),
    airFilter2Cost: z.string().min(1, "Koszt jest wymagany"),
    engineFilterName: z.string().min(1, "Nazwa jest wymagana"),
    engineFilterCost: z.string().min(1, "Koszt jest wymagany"),
    oilCost: z.string().min(1, "Koszt jest wymagany"),
    oilQuantity: z.string().min(1, "Ilość jest wymagana"),
    serviceWorkHours: z.string().min(1, "Godziny są wymagane"),
    serviceWorkRate: z.string().min(1, "Stawka jest wymagana"),
    maintenanceInterval: z.number().min(1, "Interwał musi być większy od 0"),
  });

  const form = useForm<z.infer<typeof equipmentMaintenanceSchema>>({
    resolver: zodResolver(equipmentMaintenanceSchema),
    defaultValues: {
      fuelFilter1Name: "Filtr paliwa 1",
      fuelFilter1Cost: "49.00",
      fuelFilter2Name: "Filtr paliwa 2",
      fuelFilter2Cost: "118.00",
      oilFilterName: "Filtr oleju",
      oilFilterCost: "45.00",
      airFilter1Name: "Filtr powietrza 1",
      airFilter1Cost: "105.00",
      airFilter2Name: "Filtr powietrza 2",
      airFilter2Cost: "54.00",
      engineFilterName: "Filtr silnika",
      engineFilterCost: "150.00",
      oilCost: "162.44",
      oilQuantity: "14.70",
      serviceWorkHours: "2.00",
      serviceWorkRate: "100.00",
      maintenanceInterval: 500,
    },
  });

  // Aktualizuj formularz gdy zmieni się maintenance defaults
  useEffect(() => {
    if (maintenanceDefaults) {
      form.reset({
        fuelFilter1Name: maintenanceDefaults.fuelFilter1Name || "Filtr paliwa 1",
        fuelFilter1Cost: maintenanceDefaults.fuelFilter1Cost || "49.00",
        fuelFilter2Name: maintenanceDefaults.fuelFilter2Name || "Filtr paliwa 2",
        fuelFilter2Cost: maintenanceDefaults.fuelFilter2Cost || "118.00",
        oilFilterName: maintenanceDefaults.oilFilterName || "Filtr oleju",
        oilFilterCost: maintenanceDefaults.oilFilterCost || "45.00",
        airFilter1Name: maintenanceDefaults.airFilter1Name || "Filtr powietrza 1",
        airFilter1Cost: maintenanceDefaults.airFilter1Cost || "105.00",
        airFilter2Name: maintenanceDefaults.airFilter2Name || "Filtr powietrza 2",
        airFilter2Cost: maintenanceDefaults.airFilter2Cost || "54.00",
        engineFilterName: maintenanceDefaults.engineFilterName || "Filtr silnika",
        engineFilterCost: maintenanceDefaults.engineFilterCost || "150.00",
        oilCost: maintenanceDefaults.oilCost || "162.44",
        oilQuantity: maintenanceDefaults.oilQuantity || "14.70",
        serviceWorkHours: maintenanceDefaults.serviceWorkHours || "2.00",
        serviceWorkRate: maintenanceDefaults.serviceWorkRate || "100.00",
        maintenanceInterval: maintenanceDefaults.maintenanceInterval || 500,
      });
    }
  }, [maintenanceDefaults, form]);

  // Mutacja do aktualizacji maintenance defaults
  const updateMaintenanceDefaultsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof equipmentMaintenanceSchema>) => {
      if (!selectedEquipment) throw new Error("Nie wybrano urządzenia");
      
      await apiRequest("PUT", `/api/equipment/${selectedEquipment.id}/maintenance-defaults`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Domyślne wartości eksploatacji zostały zaktualizowane",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/equipment", selectedEquipment?.id, "maintenance-defaults"] 
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nieautoryzowany dostęp",
          description: "Przekierowuję do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować domyślnych wartości",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof equipmentMaintenanceSchema>) => {
    updateMaintenanceDefaultsMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Indywidualne wartości eksploatacji urządzeń
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Wybór urządzenia */}
          <div>
            <label className="block text-sm font-medium mb-2">Wybierz urządzenie</label>
            <Select 
              value={selectedEquipment?.id.toString() || ""} 
              onValueChange={(value) => {
                const equipment = equipmentWithMaintenance.find(e => e.id.toString() === value);
                setSelectedEquipment(equipment || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz urządzenie..." />
              </SelectTrigger>
              <SelectContent>
                {equipmentWithMaintenance.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.category?.name || 'Brak kategorii'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formularz konfiguracji - tylko gdy wybrano urządzenie */}
          {selectedEquipment && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {isLoading && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Ładowanie wartości dla {selectedEquipment.name}...</p>
                  </div>
                )}

                {/* Filtry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Filtry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fuelFilter1Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra paliwa 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fuelFilter1Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuelFilter2Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra paliwa 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fuelFilter2Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="oilFilterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra oleju</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="oilFilterCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="airFilter1Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra powietrza 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="airFilter1Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="airFilter2Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra powietrza 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="airFilter2Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="engineFilterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa filtra silnika</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="engineFilterCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Olej */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Olej</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="oilCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt oleju za litr (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="oilQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ilość oleju (l)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Praca serwisanta */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Praca serwisanta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="serviceWorkHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domyślne godziny pracy (h)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceWorkRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domyślna stawka za godzinę (zł)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Interwał serwisowy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Interwał serwisowy</h3>
                  <FormField
                    control={form.control}
                    name="maintenanceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interwał serwisowy (moto-godziny)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 500)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateMaintenanceDefaultsMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMaintenanceDefaultsMutation.isPending 
                    ? "Zapisywanie..." 
                    : `Zapisz ustawienia dla ${selectedEquipment.name}`
                  }
                </Button>
              </form>
            </Form>
          )}

          {!selectedEquipment && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Wybierz urządzenie z listy powyżej, aby skonfigurować jego indywidualne wartości eksploatacji.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EquipmentMaintenanceDefaultsCard;