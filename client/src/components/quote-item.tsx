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
  // Fuel cost fields for generators (motohours-based)
  fuelConsumptionLH?: number;
  fuelPricePerLiter?: number;
  hoursPerDay?: number;
  totalFuelCost?: number;
  includeFuelCost?: boolean;
  
  // Fuel cost fields for vehicles (kilometers-based)
  fuelConsumptionPer100km?: number;
  kilometersPerDay?: number;
  calculationType?: 'motohours' | 'kilometers';

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



  // Query to get additional equipment and accessories
  const { data: additionalEquipment = [] } = useQuery<EquipmentAdditional[]>({
    queryKey: ["/api/equipment", item.equipmentId, "additional"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
  });

  // Query to get service costs for the selected equipment
  const { data: serviceCosts } = useQuery({
    queryKey: ["/api/equipment", item.equipmentId, "service-costs"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
  });

  // Query to get service items for the selected equipment
  const { data: serviceItems = [], refetch: refetchServiceItems } = useQuery({
    queryKey: ["/api/equipment", item.equipmentId, "service-items"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Auto-populate service costs from database when service items load and costs are enabled but empty
  useEffect(() => {
    if (item.includeServiceItems && serviceItems && (serviceItems as any[]).length > 0) {
      // Check if values need to be populated (all are 0)
      const hasEmptyValues = (item.serviceItem1Cost || 0) === 0 && (item.serviceItem2Cost || 0) === 0 && (item.serviceItem3Cost || 0) === 0;
      
      if (hasEmptyValues) {
        const item1Cost = (serviceItems as any[])[0]?.itemCost ? parseFloat((serviceItems as any[])[0].itemCost) : 0;
        const item2Cost = (serviceItems as any[])[1]?.itemCost ? parseFloat((serviceItems as any[])[1].itemCost) : 0;
        const item3Cost = (serviceItems as any[])[2]?.itemCost ? parseFloat((serviceItems as any[])[2].itemCost) : 0;
        
        console.log('Auto-populating service costs from database (useEffect):', { 
          serviceItemsLength: serviceItems.length,
          item1Cost, 
          item2Cost, 
          item3Cost,
          rawServiceItems: serviceItems,
          itemNames: (serviceItems as any[]).map(item => item?.itemName)
        });
        
        if (item1Cost > 0 || item2Cost > 0 || item3Cost > 0) {
          onUpdate({
            ...item,
            serviceItem1Cost: item1Cost,
            serviceItem2Cost: item2Cost,
            serviceItem3Cost: item3Cost,
          });
        }
      }
    }
  }, [serviceItems, item.includeServiceItems]);

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

        // Maintenance costs removed per user request

        // Calculate additional equipment and accessories cost
        const additionalCost = item.additionalCost || 0;
        const accessoriesCost = item.accessoriesCost || 0;
        
        // Calculate service items cost - only include if service items are enabled
        let serviceItemsCost = 0;
        if (item.includeServiceItems) {
          // Calculate service cost based on operating hours and service intervals
          let totalServiceCost = 0;
          
          // Calculate total service cost proportionally based on usage
          const totalServiceItemsCost = (item.serviceItem1Cost || 0) + (item.serviceItem2Cost || 0) + (item.serviceItem3Cost || 0);
          
          if (serviceCosts && selectedEquipment && totalServiceItemsCost > 0) {
            const isGenerator = selectedEquipment.category === 'Agregaty prądotwórcze';
            const isLightingTower = selectedEquipment.category === 'Maszty oświetleniowe';
            const isVehicle = selectedEquipment.category === 'Pojazdy';
            
            if (isGenerator || isLightingTower) {
              // For engine equipment - use motohour intervals
              const serviceIntervalMotohours = parseInt((serviceCosts as any).serviceIntervalMotohours) || 500;
              const hoursPerDay = item.hoursPerDay || 8;
              const expectedMotohours = item.rentalPeriodDays * hoursPerDay;
              
              // Calculate proportional service cost based on actual usage vs interval
              const proportionFactor = expectedMotohours / serviceIntervalMotohours;
              totalServiceCost = totalServiceItemsCost * proportionFactor;
              
              console.log(`Generator/Tower Service Calculation:`, {
                totalServiceItemsCost,
                serviceIntervalMotohours,
                expectedMotohours,
                proportionFactor,
                finalCost: totalServiceCost
              });
            } else if (isVehicle) {
              // For vehicles - use kilometer intervals
              const serviceIntervalKm = parseInt((serviceCosts as any).serviceIntervalKm) || 15000;
              const dailyKm = (item as any).dailyKm || 100;
              const expectedKm = item.rentalPeriodDays * dailyKm;
              
              // Calculate proportional service cost based on actual usage vs interval
              const proportionFactor = expectedKm / serviceIntervalKm;
              totalServiceCost = totalServiceItemsCost * proportionFactor;
            } else {
              // For other equipment - use monthly intervals
              const serviceIntervalMonths = parseInt((serviceCosts as any).serviceIntervalMonths) || 12;
              const serviceIntervalDays = serviceIntervalMonths * 30;
              
              // Calculate proportional service cost based on actual usage vs interval
              const proportionFactor = item.rentalPeriodDays / serviceIntervalDays;
              totalServiceCost = totalServiceItemsCost * proportionFactor;
            }
          } else {
            // No service cost data or no service items - use base cost
            totalServiceCost = totalServiceItemsCost;
          }
          
          serviceItemsCost = totalServiceCost;
        } else {
          serviceItemsCost = 0;
        }
        
        // Total price (maintenance costs removed per user request)
        const totalPrice = totalEquipmentPrice + fuelCost + installationCost + serviceItemsCost + additionalCost + accessoriesCost;
        




        console.log(`Final service cost being set:`, {
          serviceItemsCost,
          includeServiceItems: item.includeServiceItems,
          equipmentCategory: selectedEquipment?.category
        });
        
        onUpdate({
          ...item,
          pricePerDay,
          discountPercent,
          totalPrice,
          totalFuelCost: fuelCost,
          totalInstallationCost: installationCost,
          totalMaintenanceCost: 0,
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
    item.includeServiceItems,
    item.serviceItem1Cost,
    item.serviceItem2Cost, 
    item.serviceItem3Cost,
    serviceCosts,
    selectedEquipment,


    
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
          // Maintenance costs removed per user request
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

  // updateMaintenanceCost function removed per user request

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

        {/* Fuel Cost Calculation for Generators, Lighting Towers, Heaters, and Vehicles */}
        {selectedEquipment && (selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe' || selectedEquipment.category.name === 'Nagrzewnice' || selectedEquipment.category.name === 'Pojazdy') && (
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
              <div className="bg-muted/50 p-4 rounded-lg">
                {/* Show different inputs based on equipment category */}
                {selectedEquipment.category.name === 'Pojazdy' ? (
                  // Vehicle fuel calculation (kilometers-based)
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Zużycie paliwa (l/100km)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="np. 8.5"
                        value={item.fuelConsumptionPer100km || ""}
                        onChange={(e) => {
                          const consumption = parseFloat(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const kmPerDay = item.kilometersPerDay || 0;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelConsumptionPer100km: consumption,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Kilometry dziennie
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="np. 50"
                        value={item.kilometersPerDay || ""}
                        onChange={(e) => {
                          const kmPerDay = parseInt(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const consumption = item.fuelConsumptionPer100km || 0;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            kilometersPerDay: kmPerDay,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cena paliwa (zł/l)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="6.50"
                        value={item.fuelPricePerLiter || ""}
                        onChange={(e) => {
                          const fuelPrice = parseFloat(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const kmPerDay = item.kilometersPerDay || 0;
                          const consumption = item.fuelConsumptionPer100km || 0;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelPricePerLiter: fuelPrice,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Łączny koszt paliwa
                      </label>
                      <Input 
                        value={formatCurrency(item.totalFuelCost || 0)}
                        disabled
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.rentalPeriodDays * (item.kilometersPerDay || 0)} km całkowity przebieg
                      </p>
                    </div>
                  </div>
                ) : (
                  // Standard fuel calculation (motohours-based) for generators, lighting towers, heaters
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Zużycie paliwa (l/h)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="np. 35.3"
                        value={item.fuelConsumptionLH || ""}
                        onChange={(e) => {
                          const consumption = parseFloat(e.target.value) || 0;
                          const hours = item.hoursPerDay || 8;
                          const days = item.rentalPeriodDays;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelConsumptionLH: consumption,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Godziny pracy dziennie
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="8"
                        value={item.hoursPerDay || ""}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 8;
                          const consumption = item.fuelConsumptionLH || 0;
                          const days = item.rentalPeriodDays;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            hoursPerDay: hours,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cena paliwa (zł/l)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="6.50"
                        value={item.fuelPricePerLiter || ""}
                        onChange={(e) => {
                          const fuelPrice = parseFloat(e.target.value) || 0;
                          const consumption = item.fuelConsumptionLH || 0;
                          const hours = item.hoursPerDay || 8;
                          const days = item.rentalPeriodDays;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelPricePerLiter: fuelPrice,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Łączny koszt paliwa
                      </label>
                      <Input 
                        value={formatCurrency(item.totalFuelCost || 0)}
                        disabled
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.rentalPeriodDays * (item.hoursPerDay || 8)} mth łącznie
                      </p>
                    </div>
                  </div>
                )}
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

        {/* Service Items Enable Section (for all equipment categories) */}
        {selectedEquipment && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="includeServiceItems" 
                checked={item.includeServiceItems || false}
                onCheckedChange={(checked) => {
                  let updatedItem = { ...item };
                  
                  if (checked) {
                    // Load values from database if available
                    if (serviceItems && (serviceItems as any[]).length > 0) {
                      const item1Cost = (serviceItems as any[])[0]?.itemCost ? parseFloat((serviceItems as any[])[0].itemCost) : 0;
                      const item2Cost = (serviceItems as any[])[1]?.itemCost ? parseFloat((serviceItems as any[])[1].itemCost) : 0;
                      const item3Cost = (serviceItems as any[])[2]?.itemCost ? parseFloat((serviceItems as any[])[2].itemCost) : 0;
                      
                      console.log('Loading service costs on enable:', { 
                        item1Cost, 
                        item2Cost, 
                        item3Cost, 
                        serviceItemsData: serviceItems,
                        firstItem: (serviceItems as any[])[0],
                        secondItem: (serviceItems as any[])[1],
                        firstItemName: (serviceItems as any[])[0]?.itemName,
                        secondItemName: (serviceItems as any[])[1]?.itemName,
                        allItemNames: (serviceItems as any[]).map(item => item?.itemName)
                      });
                      
                      // Refetch latest data from server
                      refetchServiceItems();
                      
                      updatedItem = {
                        ...updatedItem,
                        serviceItem1Cost: item1Cost,
                        serviceItem2Cost: item2Cost,
                        serviceItem3Cost: item3Cost,
                      };
                    } else {
                      // No data available yet, set to 0
                      updatedItem = {
                        ...updatedItem,
                        serviceItem1Cost: 0,
                        serviceItem2Cost: 0,
                        serviceItem3Cost: 0,
                      };
                    }
                    
                    // Don't calculate totalServiceItemsCost here - let the useEffect calculate it proportionally
                    updatedItem.totalServiceItemsCost = 0; // Will be calculated by useEffect
                  } else {
                    updatedItem.totalServiceItemsCost = 0;
                  }
                  
                  updatedItem.includeServiceItems = checked as boolean;
                  onUpdate(updatedItem);
                }}
              />
              <label htmlFor="includeServiceItems" className="text-sm font-medium text-foreground">
                Uwzględnij koszty serwisowe
              </label>
            </div>
          </div>
        )}

        {/* Service Items Configuration Section (for all equipment) */}
        {selectedEquipment && item.includeServiceItems && (
          <div className="mt-4">
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Koszty serwisowe</h4>
              </div>

              {/* Operating Hours Per Day Configuration */}
              <div className="mb-4 p-3 bg-background rounded border">
                <h5 className="text-sm font-medium text-foreground mb-2">Założenia pracy urządzenia</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Godziny pracy dziennie
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={item.hoursPerDay || 8}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 8;
                        onUpdate({
                          ...item,
                          hoursPerDay: hours
                        });
                      }}
                      placeholder="8"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Standardowo: 8h/dzień (1 zmiana), 16h/dzień (2 zmiany), 24h/dzień (ciągła praca)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Łączne motogodziny
                    </label>
                    <div className="text-lg font-medium text-foreground bg-muted p-2 rounded border">
                      {(item.rentalPeriodDays * (item.hoursPerDay || 8)).toFixed(0)}h
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.rentalPeriodDays} dni × {item.hoursPerDay || 8}h/dzień
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {(serviceItems as any[])?.[0]?.itemName || 'Pozycja serwisowa 1'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem1Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem1Cost: cost
                      });
                    }}
                    placeholder={(serviceItems as any[])[0]?.itemCost ? parseFloat((serviceItems as any[])[0].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {(serviceItems as any[])?.[1]?.itemName || 'Pozycja serwisowa 2'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem2Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem2Cost: cost
                      });
                    }}
                    placeholder={(serviceItems as any[])[1]?.itemCost ? parseFloat((serviceItems as any[])[1].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {(serviceItems as any[])?.[2]?.itemName || 'Pozycja serwisowa 3'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem3Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem3Cost: cost
                      });
                    }}
                    placeholder={(serviceItems as any[])[2]?.itemCost ? parseFloat((serviceItems as any[])[2].itemCost).toFixed(2) : "0.00"}
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
                
                {/* Service calculation details */}
                {serviceCosts && (
                  <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                    <h5 className="font-medium mb-2">Szczegóły kalkulacji serwisu:</h5>
                    <div className="space-y-1 text-muted-foreground">
                      {isGenerator || isLightingTower ? (
                        <>
                          <div>Interwał serwisu: {(serviceCosts as any).serviceIntervalMotohours || 500} mth (motogodzin)</div>
                          <div>Przewidywane motogodziny: {item.rentalPeriodDays * (item.hoursPerDay || 8)} mth</div>
                          <div>Proporcja użytkowania: {((item.rentalPeriodDays * (item.hoursPerDay || 8)) / ((serviceCosts as any).serviceIntervalMotohours || 500) * 100).toFixed(2)}%</div>
                          <div>Koszt serwisu na okres: {formatCurrency(item.totalServiceItemsCost || 0)}</div>
                        </>
                      ) : (
                        <>
                          <div>Interwał serwisu: {(serviceCosts as any).serviceIntervalMonths || 12} miesięcy</div>
                          <div>Okres wynajmu: {item.rentalPeriodDays} dni</div>
                          <div>Proporcja użytkowania: {(item.rentalPeriodDays / ((serviceCosts as any).serviceIntervalMonths * 30 || 360) * 100).toFixed(2)}%</div>
                          <div>Koszt serwisu na okres: {formatCurrency(item.totalServiceItemsCost || 0)}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance costs section removed per user request */}
        {false && (
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
                    const oilTotalCost = (item.oilCost || 162.44);
                    
                    // Calculate service work cost using actual values or defaults
                    const serviceWorkCost = (item.serviceWorkHours !== undefined ? item.serviceWorkHours : 2) * (item.serviceWorkRatePerHour !== undefined ? item.serviceWorkRatePerHour : 100);
                    
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
                    fuelFilter1Cost: checked ? (item.fuelFilter1Cost || 49) : undefined,
                    fuelFilter2Cost: checked ? (item.fuelFilter2Cost || 118) : undefined,
                    oilFilterCost: checked ? (item.oilFilterCost || 45) : undefined,
                    airFilter1Cost: checked ? (item.airFilter1Cost || 105) : undefined,
                    airFilter2Cost: checked ? (item.airFilter2Cost || 54) : undefined,
                    engineFilterCost: checked ? (item.engineFilterCost || 150) : undefined,
                    oilCost: checked ? (item.oilCost || 162.44) : undefined,
                    oilQuantityLiters: checked ? (item.oilQuantityLiters || 14.7) : undefined,
                    serviceWorkHours: checked ? (item.serviceWorkHours !== undefined ? item.serviceWorkHours : 2) : undefined,
                    serviceWorkRatePerHour: checked ? (item.serviceWorkRatePerHour !== undefined ? item.serviceWorkRatePerHour : 100) : undefined,

                    maintenanceIntervalHours: checked ? (item.maintenanceIntervalHours || 500) : undefined,
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
                      {"Filtr Paliwa 1"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter1Cost || 49}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 49;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="49.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Paliwa 2"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter2Cost || 118}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 118;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="118.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Oleju"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.oilFilterCost || 45}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 45;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="45.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Powietrza 1"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter1Cost || 105}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 105;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="105.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Powietrza 2"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter2Cost || 54}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 54;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="54.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Silnika"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.engineFilterCost || 150}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 150;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="150.00"
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
                          value={item.oilCost || 162.44}
                          onChange={(e) => {
                            const cost = parseFloat(e.target.value) || 162.44;
                            // Maintenance costs removed per user request
                          }}
                          placeholder="162.44"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ilość oleju (l)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.oilQuantityLiters || 14.7}
                          onChange={(e) => {
                            const quantity = parseFloat(e.target.value) || 14.7;
                            // Maintenance costs removed per user request
                          }}
                          placeholder="14.7"
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
                      value={item.serviceWorkHours ?? 2}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        // Maintenance costs removed per user request
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
                      value={item.serviceWorkRatePerHour ?? 100}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value);
                        // Maintenance costs removed per user request
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
                        // Maintenance costs removed per user request
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
                        // Maintenance costs removed per user request
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
