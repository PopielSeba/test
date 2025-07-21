import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, Fuel, Car, Wrench, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

  // Service items for heaters
  includeServiceItems?: boolean;
  serviceItem1Cost?: number;
  serviceItem2Cost?: number;
  serviceItem3Cost?: number;
  totalServiceItemsCost?: number;

  // Maintenance/exploitation cost fields for generators
  includeMaintenanceCost?: boolean;
  maintenanceIntervalHours?: number;
  // Filter costs (6 filters)
  fuelFilter1Cost?: number;
  fuelFilter2Cost?: number;
  oilFilterCost?: number;
  airFilter1Cost?: number;
  airFilter2Cost?: number;
  engineFilterCost?: number;
  // Oil cost
  oilCost?: number;
  oilQuantityLiters?: number;
  // Service work cost
  serviceWorkHours?: number;
  serviceWorkRatePerHour?: number;
  // Service travel cost
  serviceTravelDistanceKm?: number;
  serviceTravelRatePerKm?: number;
  includeServiceTravelCost?: boolean;
  totalMaintenanceCost?: number;
  expectedMaintenanceHours?: number;

  // Additional equipment and accessories
  selectedAdditional?: number[]; // IDs of selected additional equipment
  selectedAccessories?: number[]; // IDs of selected accessories
  additionalCost?: number;
  accessoriesCost?: number;
}

interface EquipmentAdditional {
  id: number;
  equipmentId: number;
  type: "additional" | "accessories";
  name: string;
  price: string;
  position: number;
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
  additionalEquipment?: EquipmentAdditional[];
}

interface PricingSchema {
  id: number;
  name: string;
  description: string | null;
  calculationMethod: string; // "first_day" or "progressive"
  isDefault: boolean;
  isActive: boolean;
}

interface QuoteItemProps {
  item: QuoteItemData;
  equipment: Equipment[];
  pricingSchema?: PricingSchema;
  onUpdate: (item: QuoteItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
}



export default function QuoteItem({ item, equipment, pricingSchema, onUpdate, onRemove, canRemove }: QuoteItemProps) {
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
  const isGenerator = selectedEquipment?.category.name === 'Agregaty prądotwórcze';
  const isLightingTower = selectedEquipment?.category.name === 'Maszty oświetleniowe';
  const isAirConditioner = selectedEquipment?.category.name === 'Klimatyzacje';
  const hasMaintenanceCosts = isGenerator || isLightingTower || isAirConditioner;

  // Query to get maintenance defaults for the current equipment category
  const { data: maintenanceDefaults } = useQuery({
    queryKey: ["/api/maintenance-defaults", selectedEquipment?.category.name],
    enabled: !!selectedEquipment?.category.name && hasMaintenanceCosts,
    retry: false,
  });

  // Query to get additional equipment and accessories
  const { data: additionalEquipment = [] } = useQuery<EquipmentAdditional[]>({
    queryKey: ["/api/equipment", item.equipmentId, "additional"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
  });

  // Calculate price when equipment, quantity, or period changes
  useEffect(() => {
    if (selectedEquipment && item.quantity > 0 && item.rentalPeriodDays > 0) {
      const pricing = getPricingForPeriod(selectedEquipment, item.rentalPeriodDays);
      if (pricing) {
        let pricePerDay = parseFloat(pricing.pricePerDay);
        let discountPercent = parseFloat(pricing.discountPercent);
        
        // If pricing schema is provided, use it to determine calculation method
        if (pricingSchema) {
          if (pricingSchema.calculationMethod === "first_day") {
            // For first_day method: Use highest available discount from day 1, but apply base price
            const basePricing = selectedEquipment.pricing.find(p => p.periodStart === 1);
            if (basePricing) {
              const basePrice = parseFloat(basePricing.pricePerDay);
              
              // Find the pricing tier that matches this rental period
              const applicablePricing = selectedEquipment.pricing
                .filter(p => item.rentalPeriodDays >= p.periodStart && 
                           (!p.periodEnd || item.rentalPeriodDays <= p.periodEnd))[0];
              
              if (applicablePricing && parseFloat(applicablePricing.discountPercent) > 0) {
                // Apply the available discount to base price from day 1
                discountPercent = parseFloat(applicablePricing.discountPercent);
                pricePerDay = basePrice * (1 - discountPercent / 100);
              } else {
                // No discount available, use base pricing
                discountPercent = parseFloat(basePricing.discountPercent);
                pricePerDay = basePrice;
              }
            }
          } else if (pricingSchema.calculationMethod === "progressive") {
            // For progressive method: Calculate price based on progressive tiers
            let totalCost = 0;
            let currentDay = 1;
            
            // Sort pricing tiers by period start
            const sortedPricing = selectedEquipment.pricing.sort((a, b) => a.periodStart - b.periodStart);
            
            while (currentDay <= item.rentalPeriodDays) {
              // Find which tier applies to the current day
              let applicableTier = sortedPricing[0]; // default to first tier
              
              for (const tier of sortedPricing) {
                if (currentDay >= tier.periodStart && 
                    (!tier.periodEnd || currentDay <= tier.periodEnd)) {
                  applicableTier = tier;
                  break;
                }
              }
              
              const tierPrice = parseFloat(applicableTier.pricePerDay);
              totalCost += tierPrice;
              currentDay++;
            }
            
            // Calculate average price per day and effective discount
            if (totalCost > 0) {
              pricePerDay = totalCost / item.rentalPeriodDays;
              const basePricing = sortedPricing[0];
              if (basePricing) {
                const basePrice = parseFloat(basePricing.pricePerDay);
                // Use stored discount percentage instead of calculating it
                // This ensures consistency with admin panel settings
                const applicableTierForDiscount = sortedPricing.find(tier => 
                  item.rentalPeriodDays >= tier.periodStart && 
                  (!tier.periodEnd || item.rentalPeriodDays <= tier.periodEnd)
                );
                if (applicableTierForDiscount) {
                  discountPercent = parseFloat(applicableTierForDiscount.discountPercent);
                } else {
                  discountPercent = ((basePrice - pricePerDay) / basePrice) * 100;
                }
              }
            }
          }
        }
        
        if (isNaN(pricePerDay) || isNaN(discountPercent)) {
          return;
        }
        
        const totalEquipmentPrice = pricePerDay * item.quantity * item.rentalPeriodDays;
        
        // Calculate fuel cost for generators and lighting towers
        let fuelCost = 0;
        if (item.includeFuelCost && item.fuelConsumptionLH && item.fuelPricePerLiter && item.hoursPerDay) {
          const totalHours = item.rentalPeriodDays * item.hoursPerDay;
          const totalFuelNeeded = totalHours * item.fuelConsumptionLH * item.quantity;
          fuelCost = totalFuelNeeded * item.fuelPricePerLiter;
        }

        // Calculate installation cost
        let installationCost = 0;
        if (item.includeInstallationCost) {
          // Travel cost (round trip)
          const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15) * 2;
          // Service cost (per technician)
          const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
          installationCost = travelCost + serviceCost;
        }

        // Calculate maintenance cost - only include if maintenance is enabled
        let maintenanceCost = 0;
        if (item.includeMaintenanceCost) {
          maintenanceCost = item.totalMaintenanceCost || 0;
        }

        // Calculate additional equipment and accessories cost
        const additionalCost = item.additionalCost || 0;
        const accessoriesCost = item.accessoriesCost || 0;
        
        // Calculate service items cost - only include if service items are enabled
        let serviceItemsCost = 0;
        if (item.includeServiceItems) {
          serviceItemsCost = item.totalServiceItemsCost || 0;
        }
        
        // Total price is just the sum of all components (no additional discount needed)
        const totalPrice = totalEquipmentPrice + fuelCost + installationCost + maintenanceCost + serviceItemsCost + additionalCost + accessoriesCost;
        




        onUpdate({
          ...item,
          pricePerDay,
          discountPercent,
          totalPrice,
          totalFuelCost: fuelCost,
          totalInstallationCost: installationCost,
          totalMaintenanceCost: maintenanceCost,
          totalServiceItemsCost: serviceItemsCost,
          additionalCost,
          accessoriesCost,
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

    item.includeMaintenanceCost,
    item.totalMaintenanceCost,
    
    item.includeServiceItems,
    item.totalServiceItemsCost,
    item.additionalCost,
    item.accessoriesCost,
    selectedEquipment,
    pricingSchema
  ]);

  const getPricingForPeriod = (equipment: Equipment, days: number) => {
    // Sort pricing by periodStart to ensure we get the correct tier
    const sortedPricing = equipment.pricing.sort((a, b) => a.periodStart - b.periodStart);
    
    // Find the appropriate pricing tier based on days
    for (const pricing of sortedPricing) {
      if (!pricing.periodEnd) {
        // This is the last tier (e.g., 30+ days)
        if (days >= pricing.periodStart) {
          return pricing;
        }
      } else {
        // This is a bounded tier (e.g., 1-2 days, 3-7 days, etc.)
        if (days >= pricing.periodStart && days <= pricing.periodEnd) {
          return pricing;
        }
      }
    }
    
    // Fallback: return the first pricing tier if no match found
    return sortedPricing[0];
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
      
      // Auto-fill fuel consumption and maintenance costs for generators, lighting towers, and heaters
      let fuelData = {};
      if (equipment.category.name === 'Agregaty prądotwórcze' || equipment.category.name === 'Maszty oświetleniowe' || equipment.category.name === 'Nagrzewnice') {
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

  const updateMaintenanceCost = (updatedItem: QuoteItemData) => {
    if (!updatedItem.includeMaintenanceCost) {
      onUpdate({ 
        ...updatedItem, 
        totalMaintenanceCost: 0,
        // Reset all maintenance-related values
        serviceWorkHours: undefined,
        serviceWorkRatePerHour: undefined,
        fuelFilter1Cost: undefined,
        fuelFilter2Cost: undefined,
        oilFilterCost: undefined,
        airFilter1Cost: undefined,
        airFilter2Cost: undefined,
        engineFilterCost: undefined,
        oilCost: undefined,
        oilQuantityLiters: undefined
      });
      return;
    }

    // Calculate total filters cost using defaults from API
    const filtersCost = 
      (updatedItem.fuelFilter1Cost || parseFloat(maintenanceDefaults?.fuelFilter1Cost || "49")) +
      (updatedItem.fuelFilter2Cost || parseFloat(maintenanceDefaults?.fuelFilter2Cost || "118")) +
      (updatedItem.oilFilterCost || parseFloat(maintenanceDefaults?.oilFilterCost || "45")) +
      (updatedItem.airFilter1Cost || parseFloat(maintenanceDefaults?.airFilter1Cost || "105")) +
      (updatedItem.airFilter2Cost || parseFloat(maintenanceDefaults?.airFilter2Cost || "54")) +
      (updatedItem.engineFilterCost || parseFloat(maintenanceDefaults?.engineFilterCost || "150"));
    
    // Calculate oil cost using defaults from API - oilCost is already total cost, not per liter
    const oilTotalCost = updatedItem.oilCost || parseFloat(maintenanceDefaults?.oilCost || "162.44");
    
    // Calculate service work cost using defaults from API
    const serviceWorkCost = (updatedItem.serviceWorkHours ?? parseFloat(maintenanceDefaults?.serviceWorkHours || "0")) * (updatedItem.serviceWorkRatePerHour ?? parseFloat(maintenanceDefaults?.serviceWorkRate || "0"));
    
    // No travel cost for maintenance
    
    // Total maintenance cost for 500 hours
    const maintenanceCostPer500h = filtersCost + oilTotalCost + serviceWorkCost;
    
    // Calculate how much of maintenance cost applies to rental period
    const expectedHours = updatedItem.expectedMaintenanceHours !== undefined ? updatedItem.expectedMaintenanceHours : (updatedItem.rentalPeriodDays * (updatedItem.hoursPerDay || 8));
    const intervalHours = updatedItem.maintenanceIntervalHours || maintenanceDefaults?.maintenanceInterval || 500;
    
    let totalCost = 0;
    if (expectedHours > 0) {
      totalCost = (maintenanceCostPer500h / intervalHours) * expectedHours;
    }
    


    onUpdate({ ...updatedItem, totalMaintenanceCost: totalCost });
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
              {pricingSchema?.calculationMethod === "first_day" 
                ? `Rabat ${item.discountPercent}% (od 1. dnia)`
                : `Rabat ${item.discountPercent}%`
              }
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
            <p className="text-xs text-green-600 mt-1">
              Rabat: {item.discountPercent}%
            </p>
          </div>
        </div>

        {/* Fuel Cost Calculation for Generators, Lighting Towers, and Heaters */}
        {selectedEquipment && (selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe' || selectedEquipment.category.name === 'Nagrzewnice') && (
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
              onCheckedChange={(checked) => {
                let totalCost = 0;
                if (checked) {
                  const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15) * 2;
                  const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                  totalCost = travelCost + serviceCost;
                }
                onUpdate({ 
                  ...item, 
                  includeInstallationCost: checked as boolean,
                  installationDistanceKm: checked ? (item.installationDistanceKm || 0) : 0,
                  numberOfTechnicians: checked ? (item.numberOfTechnicians || 1) : 1,
                  serviceRatePerTechnician: checked ? (item.serviceRatePerTechnician || 150) : 150,
                  travelRatePerKm: checked ? (item.travelRatePerKm || 1.15) : 1.15,
                  totalInstallationCost: totalCost
                });
              }}
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
                      const travelCost = distance * (item.travelRatePerKm || 1.15) * 2;
                      const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
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
                    onChange={(e) => {
                      const technicians = parseInt(e.target.value) || 1;
                      const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15) * 2;
                      const serviceCost = technicians * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        numberOfTechnicians: technicians,
                        totalInstallationCost: totalCost
                      });
                    }}
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
                    onChange={(e) => {
                      const serviceRate = parseFloat(e.target.value) || 150;
                      const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15) * 2;
                      const serviceCost = (item.numberOfTechnicians || 1) * serviceRate;
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        serviceRatePerTechnician: serviceRate,
                        totalInstallationCost: totalCost
                      });
                    }}
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
                      const travelCost = (item.installationDistanceKm || 0) * rate * 2;
                      const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
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

        {/* Service Items Enable Section (for heaters only) */}
        {selectedEquipment?.category?.name === 'Nagrzewnice' && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="includeServiceItems" 
                checked={item.includeServiceItems || false}
                onCheckedChange={(checked) => {
                  let updatedItem = { ...item };
                  
                  if (checked) {
                    // Load default values from API if available
                    if (maintenanceDefaults && selectedEquipment?.category?.name === 'Nagrzewnice') {
                      updatedItem = {
                        ...updatedItem,
                        serviceItem1Cost: updatedItem.serviceItem1Cost || parseFloat(maintenanceDefaults.serviceItem1Cost) || 0,
                        serviceItem2Cost: updatedItem.serviceItem2Cost || parseFloat(maintenanceDefaults.serviceItem2Cost) || 0,
                        serviceItem3Cost: updatedItem.serviceItem3Cost || parseFloat(maintenanceDefaults.serviceItem3Cost) || 0,
                      };
                    }
                    
                    const totalServiceCost = (updatedItem.serviceItem1Cost || 0) + (updatedItem.serviceItem2Cost || 0) + (updatedItem.serviceItem3Cost || 0);
                    updatedItem.totalServiceItemsCost = totalServiceCost;
                  } else {
                    updatedItem.totalServiceItemsCost = 0;
                  }
                  
                  updatedItem.includeServiceItems = checked;
                  onUpdate(updatedItem);
                }}
              />
              <label htmlFor="includeServiceItems" className="text-sm font-medium text-foreground">
                Uwzględnij koszty serwisowe
              </label>
            </div>
          </div>
        )}

        {/* Service Items Configuration Section (for heaters only) */}
        {selectedEquipment?.category?.name === 'Nagrzewnice' && item.includeServiceItems && (
          <div className="mt-4">
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Koszty serwisowe</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {maintenanceDefaults?.serviceItem1Name || 'Pozycja 1'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem1Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      const totalCost = cost + (item.serviceItem2Cost || 0) + (item.serviceItem3Cost || 0);
                      onUpdate({
                        ...item,
                        serviceItem1Cost: cost,
                        totalServiceItemsCost: totalCost
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {maintenanceDefaults?.serviceItem2Name || 'Pozycja 2'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem2Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      const totalCost = (item.serviceItem1Cost || 0) + cost + (item.serviceItem3Cost || 0);
                      onUpdate({
                        ...item,
                        serviceItem2Cost: cost,
                        totalServiceItemsCost: totalCost
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {maintenanceDefaults?.serviceItem3Name || 'Pozycja 3'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem3Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      const totalCost = (item.serviceItem1Cost || 0) + (item.serviceItem2Cost || 0) + cost;
                      onUpdate({
                        ...item,
                        serviceItem3Cost: cost,
                        totalServiceItemsCost: totalCost
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Całkowity koszt serwisowy
                </label>
                <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                  {formatCurrency(item.totalServiceItemsCost || 0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance/Exploitation Cost Section (for generators, lighting towers, and air conditioners) */}
        {hasMaintenanceCosts && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="includeMaintenanceCost" 
                checked={item.includeMaintenanceCost || false}
                onCheckedChange={(checked) => {
                  let totalCost = 0;
                  if (checked) {
                    // Calculate total filters cost
                    const filtersCost = 
                      (item.fuelFilter1Cost || 49) +
                      (item.fuelFilter2Cost || 118) +
                      (item.oilFilterCost || 45) +
                      (item.airFilter1Cost || 105) +
                      (item.airFilter2Cost || 54) +
                      (item.engineFilterCost || 150);
                    
                    // Calculate oil cost
                    const oilTotalCost = (item.oilQuantityLiters || 14.7) * (item.oilCost || 162.44);
                    
                    // Calculate service work cost
                    const serviceWorkCost = (item.serviceWorkHours || 0) * (item.serviceWorkRatePerHour || 0);
                    
                    // No travel cost for maintenance
                    
                    // Total maintenance cost for 500 hours
                    const maintenanceCostPer500h = filtersCost + oilTotalCost + serviceWorkCost;
                    
                    // Calculate how much of maintenance cost applies to rental period
                    const expectedHours = item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8));
                    if (expectedHours > 0) {
                      totalCost = (maintenanceCostPer500h / 500) * expectedHours;
                    }
                  }
                  onUpdate({ 
                    ...item, 
                    includeMaintenanceCost: checked as boolean,
                    fuelFilter1Cost: checked ? (item.fuelFilter1Cost || parseFloat(maintenanceDefaults?.fuelFilter1Cost || "49")) : undefined,
                    fuelFilter2Cost: checked ? (item.fuelFilter2Cost || parseFloat(maintenanceDefaults?.fuelFilter2Cost || "118")) : undefined,
                    oilFilterCost: checked ? (item.oilFilterCost || parseFloat(maintenanceDefaults?.oilFilterCost || "45")) : undefined,
                    airFilter1Cost: checked ? (item.airFilter1Cost || parseFloat(maintenanceDefaults?.airFilter1Cost || "105")) : undefined,
                    airFilter2Cost: checked ? (item.airFilter2Cost || parseFloat(maintenanceDefaults?.airFilter2Cost || "54")) : undefined,
                    engineFilterCost: checked ? (item.engineFilterCost || parseFloat(maintenanceDefaults?.engineFilterCost || "150")) : undefined,
                    oilCost: checked ? (item.oilCost || parseFloat(maintenanceDefaults?.oilCost || "162.44")) : undefined,
                    oilQuantityLiters: checked ? (item.oilQuantityLiters || parseFloat(maintenanceDefaults?.oilQuantity || "14.7")) : undefined,
                    serviceWorkHours: checked ? (item.serviceWorkHours || parseFloat(maintenanceDefaults?.serviceWorkHours || "0")) : undefined,
                    serviceWorkRatePerHour: checked ? (item.serviceWorkRatePerHour || parseFloat(maintenanceDefaults?.serviceWorkRate || "0")) : undefined,

                    maintenanceIntervalHours: checked ? (item.maintenanceIntervalHours || maintenanceDefaults?.maintenanceInterval || 500) : undefined,
                    expectedMaintenanceHours: checked ? (item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8))) : undefined,
                    totalMaintenanceCost: checked ? totalCost : 0
                  });
                }}
              />
              <label htmlFor="includeMaintenanceCost" className="text-sm font-medium text-foreground flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                Uwzględnij koszty eksploatacji{isAirConditioner ? ' (wymiana filtrów)' : ' (co 500 mth)'}
              </label>
            </div>
            
            {item.includeMaintenanceCost && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-4">
                    <h4 className="font-medium text-foreground mb-3">Filtra (6 szt.)</h4>
                  </div>
                  
                  {/* Filter costs - 6 filters */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.fuelFilter1Name || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter1Cost || parseFloat(maintenanceDefaults?.fuelFilter1Cost || "49")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.fuelFilter1Cost || "49");
                        updateMaintenanceCost({ ...item, fuelFilter1Cost: cost });
                      }}
                      placeholder={maintenanceDefaults?.fuelFilter1Cost || "49.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.fuelFilter2Name || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter2Cost || parseFloat(maintenanceDefaults?.fuelFilter2Cost || "118")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.fuelFilter2Cost || "118");
                        updateMaintenanceCost({ ...item, fuelFilter2Cost: cost });
                      }}
                      placeholder={maintenanceDefaults?.fuelFilter2Cost || "118.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.oilFilterName || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.oilFilterCost || parseFloat(maintenanceDefaults?.oilFilterCost || "45")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.oilFilterCost || "45");
                        updateMaintenanceCost({ ...item, oilFilterCost: cost });
                      }}
                      placeholder={maintenanceDefaults?.oilFilterCost || "45.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.airFilter1Name || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter1Cost || parseFloat(maintenanceDefaults?.airFilter1Cost || "105")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.airFilter1Cost || "105");
                        updateMaintenanceCost({ ...item, airFilter1Cost: cost });
                      }}
                      placeholder={maintenanceDefaults?.airFilter1Cost || "105.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.airFilter2Name || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter2Cost || parseFloat(maintenanceDefaults?.airFilter2Cost || "54")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.airFilter2Cost || "54");
                        updateMaintenanceCost({ ...item, airFilter2Cost: cost });
                      }}
                      placeholder={maintenanceDefaults?.airFilter2Cost || "54.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {maintenanceDefaults?.engineFilterName || "Filtr"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.engineFilterCost || parseFloat(maintenanceDefaults?.engineFilterCost || "150")}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.engineFilterCost || "150");
                        updateMaintenanceCost({ ...item, engineFilterCost: cost });
                      }}
                      placeholder={maintenanceDefaults?.engineFilterCost || "150.00"}
                    />
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Suma filtrów:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(
                        (item.fuelFilter1Cost || 49) + 
                        (item.fuelFilter2Cost || 118) + 
                        (item.oilFilterCost || 45) + 
                        (item.airFilter1Cost || 105) + 
                        (item.airFilter2Cost || 54) + 
                        (item.engineFilterCost || 150)
                      )}
                    </span>
                  </div>
                </div>

                {!isAirConditioner && (
                  <>
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <h4 className="font-medium text-foreground mb-3">Olej</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Koszt oleju (zł)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.oilCost || parseFloat(maintenanceDefaults?.oilCost || "162.44")}
                          onChange={(e) => {
                            const cost = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.oilCost || "162.44");
                            updateMaintenanceCost({ ...item, oilCost: cost });
                          }}
                          placeholder={maintenanceDefaults?.oilCost || "162.44"}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ilość oleju (l)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.oilQuantityLiters || parseFloat(maintenanceDefaults?.oilQuantity || "14.7")}
                          onChange={(e) => {
                            const quantity = parseFloat(e.target.value) || parseFloat(maintenanceDefaults?.oilQuantity || "14.7");
                            updateMaintenanceCost({ ...item, oilQuantityLiters: quantity });
                          }}
                          placeholder={maintenanceDefaults?.oilQuantity || "14.7"}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-foreground mb-3">Koszt pracy serwisanta</h4>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Czas pracy (h)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.serviceWorkHours ?? 0}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        updateMaintenanceCost({ ...item, serviceWorkHours: isNaN(hours) ? 0 : hours });
                      }}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stawka za godzinę (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.serviceWorkRatePerHour ?? 0}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value);
                        updateMaintenanceCost({ ...item, serviceWorkRatePerHour: isNaN(rate) ? 0 : rate });
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Przewidywane motogodziny
                    </label>
                    <Input
                      type="number"
                      value={item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8))}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        updateMaintenanceCost({ ...item, expectedMaintenanceHours: hours });
                      }}
                      placeholder="Dni × godz/dzień"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Domyślnie: {item.rentalPeriodDays} dni × {item.hoursPerDay || 8} h/dzień
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Interwał serwisu (mth)
                    </label>
                    <Input
                      type="number"
                      value={item.maintenanceIntervalHours || 500}
                      onChange={(e) => {
                        const interval = parseInt(e.target.value) || 500;
                        updateMaintenanceCost({ ...item, maintenanceIntervalHours: interval });
                      }}
                      placeholder="500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Koszt eksploatacji
                    </label>
                    <div className="text-lg font-bold text-primary bg-primary/10 p-3 rounded-lg border-2 border-primary/20">
                      {formatCurrency(item.totalMaintenanceCost || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Za okres wynajmu
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Equipment and Accessories */}
        {additionalEquipment.length > 0 && (
          <div className="space-y-4">
            {additionalEquipment.filter(item => item.type === "additional").length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`additional-${item.id}`}
                  checked={additionalEquipment.filter(item => item.type === "additional").some(add => item.selectedAdditional?.includes(add.id))}
                  onCheckedChange={(checked) => {
                    const additionalItems = additionalEquipment.filter(item => item.type === "additional");
                    const allSelected = additionalItems.every(add => item.selectedAdditional?.includes(add.id));
                    
                    if (checked && !allSelected) {
                      // Select all additional items
                      const newSelected = [...(item.selectedAdditional || []), ...additionalItems.map(add => add.id)];
                      const cost = additionalItems.reduce((sum, add) => sum + parseFloat(add.price), 0);
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: cost
                      });
                    } else {
                      // Deselect all additional items
                      const additionalIds = additionalItems.map(add => add.id);
                      const newSelected = (item.selectedAdditional || []).filter(id => !additionalIds.includes(id));
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: 0
                      });
                    }
                  }}
                />
                <label htmlFor={`additional-${item.id}`} className="text-lg font-semibold">
                  Wyposażenie dodatkowe
                </label>
              </div>
            )}

            {additionalEquipment.filter(item => item.type === "additional").map((additional) => (
              <div key={additional.id} className="ml-6 flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`additional-item-${additional.id}`}
                    checked={item.selectedAdditional?.includes(additional.id) || false}
                    onCheckedChange={(checked) => {
                      const currentSelected = item.selectedAdditional || [];
                      let newSelected;
                      let newCost = item.additionalCost || 0;
                      
                      if (checked) {
                        newSelected = [...currentSelected, additional.id];
                        newCost += parseFloat(additional.price);
                      } else {
                        newSelected = currentSelected.filter(id => id !== additional.id);
                        newCost -= parseFloat(additional.price);
                      }
                      
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: Math.max(0, newCost)
                      });
                    }}
                  />
                  <label htmlFor={`additional-item-${additional.id}`} className="font-medium">
                    {additional.name}
                  </label>
                </div>
                <div className="text-sm font-semibold">
                  {parseFloat(additional.price).toFixed(2)} zł
                </div>
              </div>
            ))}

            {additionalEquipment.filter(item => item.type === "accessories").length > 0 && (
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id={`accessories-${item.id}`}
                  checked={additionalEquipment.filter(item => item.type === "accessories").some(acc => item.selectedAccessories?.includes(acc.id))}
                  onCheckedChange={(checked) => {
                    const accessoryItems = additionalEquipment.filter(item => item.type === "accessories");
                    const allSelected = accessoryItems.every(acc => item.selectedAccessories?.includes(acc.id));
                    
                    if (checked && !allSelected) {
                      // Select all accessories
                      const newSelected = [...(item.selectedAccessories || []), ...accessoryItems.map(acc => acc.id)];
                      const cost = accessoryItems.reduce((sum, acc) => sum + parseFloat(acc.price), 0);
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: cost
                      });
                    } else {
                      // Deselect all accessories
                      const accessoryIds = accessoryItems.map(acc => acc.id);
                      const newSelected = (item.selectedAccessories || []).filter(id => !accessoryIds.includes(id));
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: 0
                      });
                    }
                  }}
                />
                <label htmlFor={`accessories-${item.id}`} className="text-lg font-semibold">
                  Akcesoria
                </label>
              </div>
            )}

            {additionalEquipment.filter(item => item.type === "accessories").map((accessory) => (
              <div key={accessory.id} className="ml-6 flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`accessory-item-${accessory.id}`}
                    checked={item.selectedAccessories?.includes(accessory.id) || false}
                    onCheckedChange={(checked) => {
                      const currentSelected = item.selectedAccessories || [];
                      let newSelected;
                      let newCost = item.accessoriesCost || 0;
                      
                      if (checked) {
                        newSelected = [...currentSelected, accessory.id];
                        newCost += parseFloat(accessory.price);
                      } else {
                        newSelected = currentSelected.filter(id => id !== accessory.id);
                        newCost -= parseFloat(accessory.price);
                      }
                      
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: Math.max(0, newCost)
                      });
                    }}
                  />
                  <label htmlFor={`accessory-item-${accessory.id}`} className="font-medium">
                    {accessory.name}
                  </label>
                </div>
                <div className="text-sm font-semibold">
                  {parseFloat(accessory.price).toFixed(2)} zł
                </div>
              </div>
            ))}
          </div>
        )}

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
