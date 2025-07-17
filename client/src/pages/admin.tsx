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
  Shield
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
    periodStart: number;
    periodEnd?: number;
    pricePerDay: string;
    discountPercent: string;
  }>;
}

interface EquipmentCategory {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

const equipmentSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  model: z.string().optional(),
  power: z.string().optional(),
  quantity: z.number().min(0, "Ilość musi być nieujemna"),
  availableQuantity: z.number().min(0, "Dostępna ilość musi być nieujemna"),
  categoryId: z.number().min(1, "Kategoria jest wymagana"),
  // Technical specifications for generators
  fuelConsumption75: z.number().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  engine: z.string().optional(),
  alternator: z.string().optional(),
  fuelTankCapacity: z.number().optional(),

});

const categorySchema = z.object({
  name: z.string().min(1, "Nazwa kategorii jest wymagana"),
  description: z.string().optional(),
});

const pricingSchema = z.object({
  equipmentId: z.number(),
  periodStart: z.number().min(1, "Początek okresu musi być większy od 0"),
  periodEnd: z.number().optional(),
  pricePerDay: z.string().min(1, "Cena jest wymagana"),
  discountPercent: z.string(),
});

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [selectedEquipmentForPricing, setSelectedEquipmentForPricing] = useState<Equipment | null>(null);
  const [editingPricingTable, setEditingPricingTable] = useState<any>({});
  const [localPrices, setLocalPrices] = useState<Record<number, number>>({});

  // Initialize local prices when equipment is selected
  useEffect(() => {
    if (selectedEquipmentForPricing) {
      const initialPrices: Record<number, number> = {};
      selectedEquipmentForPricing.pricing.forEach(p => {
        initialPrices[p.id] = parseFloat(p.pricePerDay || "0");
      });
      setLocalPrices(initialPrices);
    } else {
      setLocalPrices({});
    }
  }, [selectedEquipmentForPricing?.id]);

  // Check if user is admin
  if (!authLoading && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Brak uprawnień</h2>
            <p className="text-muted-foreground">Nie masz uprawnień administratora aby uzyskać dostęp do tej strony.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    enabled: user?.role === 'admin',
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<EquipmentCategory[]>({
    queryKey: ["/api/equipment-categories"],
    enabled: user?.role === 'admin',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  const equipmentForm = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      model: "",
      power: "",
      quantity: 0,
      availableQuantity: 0,
      categoryId: 0,
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const pricingForm = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      equipmentId: 0,
      periodStart: 1,
      periodEnd: undefined,
      pricePerDay: "",
      discountPercent: "0",
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof equipmentSchema>) => {
      const response = await apiRequest("POST", "/api/equipment", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: data.message || "Sprzęt został dodany pomyślnie",
      });
      handleCloseEquipmentDialog();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać sprzętu",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof equipmentSchema>> }) => {
      const response = await apiRequest("PUT", `/api/equipment/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Sprzęt został zaktualizowany pomyślnie",
      });
      handleCloseEquipmentDialog();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować sprzętu",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/equipment/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Sprzęt został usunięty pomyślnie",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć sprzętu",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      const response = await apiRequest("POST", "/api/equipment-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-categories"] });
      toast({
        title: "Sukces",
        description: "Kategoria została dodana pomyślnie",
      });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać kategorii",
        variant: "destructive",
      });
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pricingSchema>) => {
      const response = await apiRequest("POST", "/api/equipment-pricing", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Cennik został dodany pomyślnie",
      });
      setIsPricingDialogOpen(false);
      pricingForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać cennika",
        variant: "destructive",
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; pricePerDay?: string; discountPercent?: string }) => {
      const response = await apiRequest("PATCH", `/api/equipment-pricing/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Cennik został zaktualizowany",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować cennika",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/users/${id}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Rola użytkownika została zaktualizowana",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować roli użytkownika",
        variant: "destructive",
      });
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/users/${id}/toggle-active`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Status aktywności użytkownika został zmieniony",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu aktywności użytkownika",
        variant: "destructive",
      });
    },
  });

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    equipmentForm.reset({
      name: equipment.name,
      description: equipment.description || "",
      model: equipment.model || "",
      power: equipment.power || "",
      quantity: equipment.quantity,
      availableQuantity: equipment.availableQuantity,
      categoryId: equipment.category.id,
      fuelConsumption75: equipment.fuelConsumption75,
      dimensions: equipment.dimensions || "",
      weight: equipment.weight || "",
      engine: equipment.engine || "",
      alternator: equipment.alternator || "",
      fuelTankCapacity: equipment.fuelTankCapacity,
    });
    setIsEquipmentDialogOpen(true);
  };

  const handleCloseEquipmentDialog = () => {
    setIsEquipmentDialogOpen(false);
    setSelectedEquipment(null);
    equipmentForm.reset({
      name: "",
      description: "",
      model: "",
      power: "",
      quantity: 0,
      availableQuantity: 0,
      categoryId: 0,
      fuelConsumption75: undefined,
      dimensions: "",
      weight: "",
      engine: "",
      alternator: "",
      fuelTankCapacity: undefined,
    });
  };

  const handleDeleteEquipment = (id: number) => {
    if (confirm("Czy na pewno chcesz usunąć ten sprzęt?")) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const onSubmitEquipment = (data: z.infer<typeof equipmentSchema>) => {
    if (selectedEquipment) {
      updateEquipmentMutation.mutate({ id: selectedEquipment.id, data });
    } else {
      createEquipmentMutation.mutate(data);
    }
  };

  const onSubmitCategory = (data: z.infer<typeof categorySchema>) => {
    createCategoryMutation.mutate(data);
  };

  const onSubmitPricing = (data: z.infer<typeof pricingSchema>) => {
    createPricingMutation.mutate(data);
  };

  const createStandardPricing = async (equipmentId: number) => {
    const standardPricing = [
      { periodStart: 1, periodEnd: 2, pricePerDay: "350", discountPercent: "0" },
      { periodStart: 3, periodEnd: 7, pricePerDay: "300", discountPercent: "14.29" },
      { periodStart: 8, periodEnd: 18, pricePerDay: "250", discountPercent: "28.57" },
      { periodStart: 19, periodEnd: 29, pricePerDay: "200", discountPercent: "42.86" },
      { periodStart: 30, periodEnd: undefined, pricePerDay: "150", discountPercent: "57.14" },
    ];

    for (const pricing of standardPricing) {
      createPricingMutation.mutate({
        equipmentId,
        ...pricing
      });
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(parseFloat(amount));
  };

  const getPeriodText = (start: number, end?: number) => {
    if (!end) return `${start}+ dni`;
    return `${start}-${end} dni`;
  };

  if (authLoading || equipmentLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Panel Administratora</h1>
          <p className="text-muted-foreground mt-2">Zarządzaj sprzętem, cenami i ustawieniami systemu</p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Zarządzanie użytkownikami
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Użytkownicy są automatycznie dodawani podczas pierwszego logowania
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Użytkownik</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rola</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email?.split('@')[0] || 'Nieznany użytkownik'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? (
                                <Shield className="w-3 h-3 mr-1" />
                              ) : null}
                              {user.role === 'admin' ? 'Admin' : 'Pracownik'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? (
                              <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                              <UserX className="w-3 h-3 mr-1" />
                            )}
                            {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={user.role} 
                              onValueChange={(role) => updateUserRoleMutation.mutate({ id: user.id, role })}
                              disabled={updateUserRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Pracownik</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserActiveMutation.mutate(user.id)}
                              disabled={toggleUserActiveMutation.isPending}
                              title={user.isActive ? "Deaktywuj użytkownika" : "Aktywuj użytkownika"}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Zarządzanie sprzętem
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Kategoria
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Dodaj kategorię</DialogTitle>
                        </DialogHeader>
                        <Form {...categoryForm}>
                          <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                            <FormField
                              control={categoryForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nazwa kategorii</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={categoryForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Opis</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={createCategoryMutation.isPending}>
                              {createCategoryMutation.isPending ? "Dodawanie..." : "Dodaj kategorię"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isEquipmentDialogOpen} onOpenChange={handleCloseEquipmentDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Sprzęt
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedEquipment ? "Edytuj sprzęt" : "Dodaj sprzęt"}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...equipmentForm}>
                          <form onSubmit={equipmentForm.handleSubmit(onSubmitEquipment)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={equipmentForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nazwa</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={equipmentForm.control}
                                name="categoryId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Kategoria</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value > 0 ? field.value.toString() : ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Wybierz kategorię" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {categories.map((category) => (
                                          <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={equipmentForm.control}
                                name="model"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Model</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={equipmentForm.control}
                                name="power"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Moc</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="np. 90.18 kW" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={equipmentForm.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ilość całkowita</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={equipmentForm.control}
                                name="availableQuantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ilość dostępna</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={equipmentForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Opis</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Technical specifications for generators */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium text-foreground">Parametry techniczne (agregaty)</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={equipmentForm.control}
                                  name="fuelConsumption75"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Spalanie przy 75% obciążenia (l/h)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.1"
                                          {...field} 
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="fuelTankCapacity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Pojemność zbiornika paliwa (l)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="engine"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Silnik</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. VOLVO TAD734GE" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="alternator"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Alternator</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. LEROY SOMER" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="dimensions"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Wymiary (DxSxW mm)</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. 3600x1100x1800" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="weight"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Waga (kg)</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. 1850" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>


                            <div className="flex justify-end space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setIsEquipmentDialogOpen(false);
                                  setSelectedEquipment(null);
                                  equipmentForm.reset();
                                }}
                              >
                                Anuluj
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                              >
                                {selectedEquipment 
                                  ? (updateEquipmentMutation.isPending ? "Aktualizowanie..." : "Aktualizuj")
                                  : (createEquipmentMutation.isPending ? "Dodawanie..." : "Dodaj")
                                }
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nazwa</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Ilość</TableHead>
                        <TableHead>Dostępne</TableHead>
                        <TableHead>Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Brak sprzętu do wyświetlenia
                          </TableCell>
                        </TableRow>
                      ) : (
                        equipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.model && (
                                  <div className="text-sm text-muted-foreground">{item.model}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category.name}</Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <span className={item.availableQuantity > 0 ? "text-green-600" : "text-red-600"}>
                                {item.availableQuantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEquipment(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    pricingForm.reset({
                                      equipmentId: item.id,
                                      periodStart: 1,
                                      periodEnd: 2,
                                      pricePerDay: "",
                                      discountPercent: "0",
                                    });
                                    setIsPricingDialogOpen(true);
                                  }}
                                  title="Dodaj cennik"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEquipment(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Additional and Accessories Management */}
            {equipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Wyposażenie dodatkowe i akcesoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {equipment.map((item) => (
                    <EquipmentAdditionalManager
                      key={item.id}
                      equipmentId={item.id}
                      equipmentName={item.name}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings and Users */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Ustawienia cenowe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stawka VAT (%)</label>
                  <Input type="number" defaultValue="23" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Domyślna waluta</label>
                  <Select defaultValue="PLN">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz ustawienia
                </Button>
              </CardContent>
            </Card>

            <MaintenanceDefaultsCard />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Użytkownicy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email?.split('@')[0] || 'Aktualny użytkownik'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                    <Badge>Aktualny</Badge>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj użytkownika
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Tables Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Edycja cenników</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <Button
                      key={item.id}
                      variant={selectedEquipmentForPricing?.id === item.id ? "default" : "outline"}
                      onClick={() => {
                        setSelectedEquipmentForPricing(item);
                        setLocalPrices({});
                      }}
                      className="mb-2"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>

                {selectedEquipmentForPricing && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {selectedEquipmentForPricing.name} - zasilane paliwem:
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                              Okres wynajmu
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                              Cena netto / doba
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                              Obniżka kwotowa
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                              Procent zniżki
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEquipmentForPricing.pricing.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-500">
                                Brak cennika. Dodaj pierwszy przedział cenowy.
                              </td>
                            </tr>
                          ) : (
                            selectedEquipmentForPricing.pricing
                              .sort((a, b) => a.periodStart - b.periodStart)
                              .map((pricing, index) => {
                                // Find the base price (first period, usually 1-2 days)
                                const sortedPricing = selectedEquipmentForPricing.pricing.sort((a, b) => a.periodStart - b.periodStart);
                                const basePrice = localPrices[sortedPricing[0]?.id] ?? parseFloat(sortedPricing[0]?.pricePerDay || "0");
                                const currentPrice = localPrices[pricing.id] ?? parseFloat(pricing.pricePerDay || "0");
                                const discountAmount = basePrice - currentPrice;
                                const discountPercent = basePrice > 0 ? ((discountAmount / basePrice) * 100).toFixed(2) : "0";
                                
                                const getPeriodText = (start: number, end?: number) => {
                                  if (start === 1 && end === 2) return "1 - 2 dni";
                                  if (start === 3 && end === 7) return "3 - 7 dni";
                                  if (start === 8 && end === 18) return "8 - 18 dni";
                                  if (start === 19 && end === 29) return "19 - 29 dni";
                                  if (start === 30 && !end) return "30 dni i więcej";
                                  return end ? `${start} - ${end} dni` : `${start} dni i więcej`;
                                };
                                
                                const periodText = getPeriodText(pricing.periodStart, pricing.periodEnd);

                              return (
                                <tr key={pricing.id}>
                                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">
                                    {periodText}
                                  </td>
                                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={localPrices[pricing.id] ?? currentPrice}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setLocalPrices(prev => ({
                                          ...prev,
                                          [pricing.id]: newPrice
                                        }));
                                      }}
                                      onBlur={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        const originalPrice = parseFloat(pricing.pricePerDay || "0");
                                        if (newPrice !== originalPrice) {
                                          updatePricingMutation.mutate({
                                            id: pricing.id,
                                            pricePerDay: newPrice.toString()
                                          });
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const newPrice = parseFloat(e.currentTarget.value) || 0;
                                          const originalPrice = parseFloat(pricing.pricePerDay || "0");
                                          if (newPrice !== originalPrice) {
                                            updatePricingMutation.mutate({
                                              id: pricing.id,
                                              pricePerDay: newPrice.toString()
                                            });
                                          }
                                        }
                                      }}
                                      className="w-20 text-right"
                                    />
                                    <span className="ml-1">zł</span>
                                  </td>
                                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                                    {discountAmount.toFixed(0)} zł
                                  </td>
                                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                                    {discountPercent}%
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => {
                          pricingForm.setValue('equipmentId', selectedEquipmentForPricing.id);
                          setIsPricingDialogOpen(true);
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Dodaj przedział
                      </Button>
                      
                      {selectedEquipmentForPricing.pricing.length === 0 && (
                        <Button
                          onClick={() => createStandardPricing(selectedEquipmentForPricing.id)}
                          size="sm"
                          variant="outline"
                        >
                          Utwórz standardowe progi
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Dialog */}
        <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj cennik</DialogTitle>
            </DialogHeader>
            <Form {...pricingForm}>
              <form onSubmit={pricingForm.handleSubmit(onSubmitPricing)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pricingForm.control}
                    name="periodStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Początek okresu (dni)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={pricingForm.control}
                    name="periodEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Koniec okresu (dni)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Puste dla 30+"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={pricingForm.control}
                  name="pricePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena za dobę (PLN)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="350.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pricingForm.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procent rabatu (%)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsPricingDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={createPricingMutation.isPending}>
                    {createPricingMutation.isPending ? "Dodawanie..." : "Dodaj cennik"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Komponent dla zarządzania domyślnymi wartościami eksploatacji
function MaintenanceDefaultsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("Agregaty prądotwórcze");

  // Query do pobierania aktualnych domyślnych wartości dla wybranej kategorii
  const { data: maintenanceDefaults, isLoading } = useQuery({
    queryKey: ["/api/maintenance-defaults", selectedCategory],
    retry: false,
  });

  // Schema dla walidacji formularza
  const maintenanceDefaultsSchema = z.object({
    fuelFilter1Name: z.string().min(1, "Nazwa jest wymagana"),
    fuelFilter1Cost: z.number().min(0, "Koszt musi być nieujemny"),
    fuelFilter2Name: z.string().min(1, "Nazwa jest wymagana"),
    fuelFilter2Cost: z.number().min(0, "Koszt musi być nieujemny"),
    oilFilterName: z.string().min(1, "Nazwa jest wymagana"),
    oilFilterCost: z.number().min(0, "Koszt musi być nieujemny"),
    airFilter1Name: z.string().min(1, "Nazwa jest wymagana"),
    airFilter1Cost: z.number().min(0, "Koszt musi być nieujemny"),
    airFilter2Name: z.string().min(1, "Nazwa jest wymagana"),
    airFilter2Cost: z.number().min(0, "Koszt musi być nieujemny"),
    engineFilterName: z.string().min(1, "Nazwa jest wymagana"),
    engineFilterCost: z.number().min(0, "Koszt musi być nieujemny"),
    oilCost: z.number().min(0, "Koszt musi być nieujemny"),
    oilQuantity: z.number().min(0, "Ilość musi być nieujemna"),
    serviceWorkHours: z.number().min(0, "Godziny muszą być nieujemne"),
    serviceWorkRate: z.number().min(0, "Stawka musi być nieujemna"),
    maintenanceInterval: z.number().min(1, "Interwał musi być większy od 0"),
    serviceItem1Name: z.string().optional(),
    serviceItem1Cost: z.number().min(0, "Koszt musi być nieujemny").optional(),
    serviceItem2Name: z.string().optional(),
    serviceItem2Cost: z.number().min(0, "Koszt musi być nieujemny").optional(),
    serviceItem3Name: z.string().optional(),
    serviceItem3Cost: z.number().min(0, "Koszt musi być nieujemny").optional(),
  });

  // Hook formularza z domyślnymi wartościami
  const form = useForm<z.infer<typeof maintenanceDefaultsSchema>>({
    resolver: zodResolver(maintenanceDefaultsSchema),
    defaultValues: {
      fuelFilter1Name: "Filtr Paliwa 1",
      fuelFilter1Cost: 49,
      fuelFilter2Name: "Filtr Paliwa 2", 
      fuelFilter2Cost: 118,
      oilFilterName: "Filtr Oleju",
      oilFilterCost: 45,
      airFilter1Name: "Filtr Powietrza 1",
      airFilter1Cost: 105,
      airFilter2Name: "Filtr Powietrza 2",
      airFilter2Cost: 54,
      engineFilterName: "Filtr Silnika",
      engineFilterCost: 150,
      oilCost: 162.44,
      oilQuantity: 14.7,
      serviceWorkHours: 0,
      serviceWorkRate: 0,
      maintenanceInterval: 500,
    },
  });

  // Aktualizacja formularza gdy pobierzemy dane z API
  useEffect(() => {
    if (maintenanceDefaults) {
      form.reset({
        fuelFilter1Name: maintenanceDefaults.fuelFilter1Name,
        fuelFilter1Cost: parseFloat(maintenanceDefaults.fuelFilter1Cost),
        fuelFilter2Name: maintenanceDefaults.fuelFilter2Name,
        fuelFilter2Cost: parseFloat(maintenanceDefaults.fuelFilter2Cost),
        oilFilterName: maintenanceDefaults.oilFilterName,
        oilFilterCost: parseFloat(maintenanceDefaults.oilFilterCost),
        airFilter1Name: maintenanceDefaults.airFilter1Name,
        airFilter1Cost: parseFloat(maintenanceDefaults.airFilter1Cost),
        airFilter2Name: maintenanceDefaults.airFilter2Name,
        airFilter2Cost: parseFloat(maintenanceDefaults.airFilter2Cost),
        engineFilterName: maintenanceDefaults.engineFilterName,
        engineFilterCost: parseFloat(maintenanceDefaults.engineFilterCost),
        oilCost: parseFloat(maintenanceDefaults.oilCost),
        oilQuantity: parseFloat(maintenanceDefaults.oilQuantity),
        serviceWorkHours: parseFloat(maintenanceDefaults.serviceWorkHours),
        serviceWorkRate: parseFloat(maintenanceDefaults.serviceWorkRate),
        maintenanceInterval: maintenanceDefaults.maintenanceInterval,
        serviceItem1Name: maintenanceDefaults.serviceItem1Name || '',
        serviceItem1Cost: parseFloat(maintenanceDefaults.serviceItem1Cost) || 0,
        serviceItem2Name: maintenanceDefaults.serviceItem2Name || '',
        serviceItem2Cost: parseFloat(maintenanceDefaults.serviceItem2Cost) || 0,
        serviceItem3Name: maintenanceDefaults.serviceItem3Name || '',
        serviceItem3Cost: parseFloat(maintenanceDefaults.serviceItem3Cost) || 0,
      });
    }
  }, [maintenanceDefaults, form]);

  // Mutacja do zapisywania zmian
  const updateDefaultsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof maintenanceDefaultsSchema>) => {
      const response = await apiRequest("PUT", `/api/maintenance-defaults/${selectedCategory}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-defaults", selectedCategory] });
      toast({
        title: "Sukces",
        description: "Domyślne wartości zostały zaktualizowane",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować domyślnych wartości",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof maintenanceDefaultsSchema>) => {
    updateDefaultsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Domyślne wartości eksploatacji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Ładowanie...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wrench className="w-5 h-5 mr-2" />
          Domyślne wartości eksploatacji
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Kategoria sprzętu</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Agregaty prądotwórcze">Agregaty prądotwórcze</SelectItem>
              <SelectItem value="Maszty oświetleniowe">Maszty oświetleniowe</SelectItem>
              <SelectItem value="Klimatyzacje">Klimatyzacje</SelectItem>
              <SelectItem value="Nagrzewnice">Nagrzewnice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Filtry */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filtry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtr Paliwa 1 */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="fuelFilter1Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwa filtra 1</FormLabel>
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filtr Paliwa 2 */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="fuelFilter2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwa filtra 2</FormLabel>
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filtr Oleju */}
                <div className="space-y-2">
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filtr Powietrza 1 */}
                <div className="space-y-2">
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filtr Powietrza 2 */}
                <div className="space-y-2">
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filtr Silnika */}
                <div className="space-y-2">
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Olej - tylko dla agregatów i masztów */}
            {selectedCategory !== 'Klimatyzacje' && (
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
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
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
                          <Input 
                            type="number" 
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
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
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pozycje serwisowe - tylko dla nagrzewnic */}
            {selectedCategory === 'Nagrzewnice' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pozycje serwisowe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pozycja 1 */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="serviceItem1Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa pozycji 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceItem1Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pozycja 2 */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="serviceItem2Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa pozycji 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceItem2Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pozycja 3 */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="serviceItem3Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa pozycji 3</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceItem3Cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koszt (zł)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

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

            <Button type="submit" className="w-full" disabled={updateDefaultsMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateDefaultsMutation.isPending ? "Zapisywanie..." : "Zapisz domyślne wartości"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
