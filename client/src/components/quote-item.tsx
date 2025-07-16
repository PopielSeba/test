import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, Fuel, Car } from "lucide-react";

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

interface QuoteItemProps {
  item: QuoteItemData;
  equipment: Equipment[];
  onUpdate: (item: QuoteItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
}



export default function QuoteItem({ item, equipment, onUpdate, onRemove, canRemove }: QuoteItemProps) {
  // Initialize selectedCategory based on current equipment
  const currentEquipment = equipment.find(eq => eq.id === item.equipmentId);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    currentEquipment ? currentEquipment.category.id : null
  );

  // Get unique categories
  const categories = equipment.reduce((acc, eq) => {
    if (!acc.find(cat => cat.id === eq.category.id)) {
      acc.push(eq.category);
    }
    return acc;
  }, [] as Array<{ id: number; name: string }>);

  // Get equipment for selected category
  const categoryEquipment = selectedCategory 
    ? equipment.filter(eq => eq.category.id === selectedCategory)
    : [];

  // Update selectedCategory when equipment changes from outside (auto-add from URL)
  useEffect(() => {
    if (item.equipmentId && equipment.length > 0) {
      const currentEquipment = equipment.find(eq => eq.id === item.equipmentId);
      if (currentEquipment && selectedCategory !== currentEquipment.category.id) {
        setSelectedCategory(currentEquipment.category.id);
      }
    }
  }, [item.equipmentId, equipment, selectedCategory]);

  // Get selected equipment
  const selectedEquipment = equipment.find(eq => eq.id === item.equipmentId);

  // Calculate price when equipment, quantity, or period changes
  useEffect(() => {
    if (selectedEquipment && item.quantity > 0 && item.rentalPeriodDays > 0) {
      const pricing = getPricingForPeriod(selectedEquipment, item.rentalPeriodDays);
      if (pricing) {
        const pricePerDay = parseFloat(pricing.pricePerDay);
        const discountPercent = parseFloat(pricing.discountPercent);
        
        if (isNaN(pricePerDay) || isNaN(discountPercent)) {
          return;
        }
        
        const basePrice = pricePerDay * item.quantity * item.rentalPeriodDays;
        
        // Calculate fuel cost for generators and lighting towers
        let fuelCost = 0;
        if (item.includeFuelCost && item.fuelConsumptionLH && item.fuelPricePerLiter && item.hoursPerDay) {
          const totalHours = item.rentalPeriodDays * item.hoursPerDay;
          const totalFuelNeeded = totalHours * item.fuelConsumptionLH * item.quantity;
          fuelCost = totalFuelNeeded * item.fuelPricePerLiter;
        }


        
        // Calculate installation cost
        let installationCost = 0;
        if (item.includeInstallationCost && item.installationDistanceKm && item.travelRatePerKm) {
          installationCost = item.installationDistanceKm * item.travelRatePerKm * 2; // round trip
        }
        
        // Calculate discount
        const discountAmount = basePrice * (discountPercent / 100);
        const discountedBasePrice = basePrice - discountAmount;
        const totalPrice = discountedBasePrice + fuelCost + installationCost;
        


        onUpdate({
          ...item,
          pricePerDay,
          discountPercent,
          totalPrice,
          totalFuelCost: fuelCost,
          totalInstallationCost: installationCost,
        });
      }
    }
  }, [
    item.equipmentId, 
    item.quantity, 
    item.rentalPeriodDays, 
    item.includeFuelCost, 
    item.fuelConsumptionLH, 
    item.fuelPricePerLiter, 
    item.hoursPerDay, 

    item.includeInstallationCost, 
    item.installationDistanceKm, 
    item.travelRatePerKm,
    item.numberOfTechnicians,
    item.serviceRatePerTechnician,
    selectedEquipment
  ]);

  const getPricingForPeriod = (equipment: Equipment, days: number) => {
    // Find the appropriate pricing tier based on days
    return equipment.pricing.find(p => {
      if (p.periodEnd === null) {
        return days >= p.periodStart;
      }
      return days >= p.periodStart && days <= p.periodEnd;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    const catId = parseInt(categoryId);
    setSelectedCategory(catId);
    // Reset equipment selection when category changes
    onUpdate({
      ...item,
      equipmentId: 0,
      pricePerDay: 0,
      discountPercent: 0,
      totalPrice: 0,
    });
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const eqId = parseInt(equipmentId);
    const equipment = categoryEquipment.find(eq => eq.id === eqId);
    
    if (equipment) {
      // Set the category based on selected equipment
      setSelectedCategory(equipment.category.id);
      
      // Auto-fill fuel consumption and maintenance costs for generators and lighting towers
      let fuelData = {};
      if (equipment.category.name === 'Agregaty prądotwórcze' || equipment.category.name === 'Maszty oświetleniowe') {
        fuelData = {
          includeFuelCost: true,
          fuelConsumptionLH: equipment.fuelConsumption75 || 0,
          fuelPricePerLiter: 6.50, // Default fuel price PLN/liter
          hoursPerDay: 8,
          totalFuelCost: 0,
          includeMaintenanceCost: false, // User can enable manually
          maintenanceCostPerPeriod: 0,
          expectedMaintenanceHours: 0
        };
      }
      
      onUpdate({
        ...item,
        equipmentId: eqId,
        pricePerDay: 0,
        discountPercent: 0,
        totalPrice: 0,
        ...fuelData
      });
    } else {
      onUpdate({
        ...item,
        equipmentId: eqId,
        pricePerDay: 0,
        discountPercent: 0,
        totalPrice: 0,
      });
    }
  };

  const handleQuantityChange = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    onUpdate({
      ...item,
      quantity: qty,
    });
  };

  const handlePeriodChange = (days: string) => {
    const period = parseInt(days) || 1;
    onUpdate({
      ...item,
      rentalPeriodDays: period,
    });
  };

  const getDiscountInfo = (days: number) => {
    if (days >= 30) return "Rabat 57.14%";
    if (days >= 19) return "Rabat 42.86%";
    if (days >= 8) return "Rabat 28.57%";
    if (days >= 3) return "Rabat 14.29%";
    return "Bez rabatu";
  };

  const handleNotesChange = (notes: string) => {
    onUpdate({
      ...item,
      notes,
    });
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
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kategoria</label>
            <Select value={selectedCategory?.toString() || ""} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sprzęt</label>
            <Select 
              value={item.equipmentId.toString()} 
              onValueChange={handleEquipmentChange}
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategory ? "Wybierz sprzęt" : "Najpierw wybierz kategorię"} />
              </SelectTrigger>
              <SelectContent>
                {categoryEquipment.map((equipment) => (
                  <SelectItem key={equipment.id} value={equipment.id.toString()}>
                    {equipment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Ilość</label>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Okres wynajmu (dni)</label>
            <Input
              type="number"
              min="1"
              max="365"
              value={item.rentalPeriodDays}
              onChange={(e) => handlePeriodChange(e.target.value)}
              placeholder="1"
              className="text-center"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {getDiscountInfo(item.rentalPeriodDays)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cena netto</label>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-foreground">
                {formatCurrency(item.totalPrice)}
              </span>
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {item.discountPercent > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Rabat: {item.discountPercent}%
              </p>
            )}
          </div>
        </div>

        {/* Fuel Cost Calculation for Generators and Lighting Towers */}
        {selectedEquipment && (selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe') && (
          <div className="mt-4">
            <Separator className="my-4" />
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="includeFuelCost" 
                checked={item.includeFuelCost || false}
                onCheckedChange={(checked) => 
                  onUpdate({ 
                    ...item, 
                    includeFuelCost: checked as boolean,
                    totalFuelCost: checked ? item.totalFuelCost : 0
                  })
                }
              />
              <label htmlFor="includeFuelCost" className="text-sm font-medium text-foreground flex items-center">
                <Fuel className="w-4 h-4 mr-2" />
                Uwzględnij koszty paliwa
              </label>
            </div>
            
            {item.includeFuelCost && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Zużycie paliwa (l/h)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.fuelConsumptionLH || ""}
                    onChange={(e) => onUpdate({
                      ...item,
                      fuelConsumptionLH: parseFloat(e.target.value) || 0
                    })}
                    placeholder="np. 15.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cena paliwa (zł/l)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.fuelPricePerLiter || ""}
                    onChange={(e) => onUpdate({
                      ...item,
                      fuelPricePerLiter: parseFloat(e.target.value) || 0
                    })}
                    placeholder="np. 6.50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Godziny pracy/dzień
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={item.hoursPerDay || 8}
                    onChange={(e) => onUpdate({
                      ...item,
                      hoursPerDay: parseInt(e.target.value) || 8
                    })}
                    placeholder="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt paliwa
                  </label>
                  <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                    {formatCurrency(item.totalFuelCost || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Installation Cost Section */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="includeInstallationCost" 
              checked={item.includeInstallationCost || false}
              onCheckedChange={(checked) => 
                onUpdate({ 
                  ...item, 
                  includeInstallationCost: checked as boolean,
                  installationDistanceKm: checked ? (item.installationDistanceKm || 0) : 0,
                  numberOfTechnicians: checked ? (item.numberOfTechnicians || 1) : 1,
                  serviceRatePerTechnician: checked ? (item.serviceRatePerTechnician || 150) : 150,
                  travelRatePerKm: checked ? (item.travelRatePerKm || 1.15) : 1.15,
                  totalInstallationCost: checked ? (item.totalInstallationCost || 0) : 0
                })
              }
            />
            <label htmlFor="includeInstallationCost" className="text-sm font-medium text-foreground flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Uwzględnij koszty montażu
            </label>
          </div>
          
          {item.includeInstallationCost && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Odległość (km)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.installationDistanceKm || ""}
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value) || 0;
                      const totalCost = distance * (item.travelRatePerKm || 1.15) * 2; // round trip
                      onUpdate({
                        ...item,
                        installationDistanceKm: distance,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="np. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość techników
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.numberOfTechnicians || 1}
                    onChange={(e) => onUpdate({
                      ...item,
                      numberOfTechnicians: parseInt(e.target.value) || 1
                    })}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stawka za usługę (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceRatePerTechnician || 150}
                    onChange={(e) => onUpdate({
                      ...item,
                      serviceRatePerTechnician: parseFloat(e.target.value) || 150
                    })}
                    placeholder="150.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stawka za km (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.travelRatePerKm || 1.15}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 1.15;
                      const totalCost = (item.installationDistanceKm || 0) * rate * 2; // round trip
                      onUpdate({
                        ...item,
                        travelRatePerKm: rate,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="1.15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt montażu
                  </label>
                  <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                    {formatCurrency(item.totalInstallationCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    W obie strony
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">Uwagi</label>
          <Textarea
            value={item.notes || ""}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Dodatkowe uwagi do pozycji"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
