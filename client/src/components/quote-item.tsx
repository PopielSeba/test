import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

interface QuoteItemData {
  id: string;
  equipmentId: number;
  quantity: number;
  rentalPeriodDays: number;
  pricePerDay: number;
  discountPercent: number;
  totalPrice: number;
  notes?: string;
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
}

interface QuoteItemProps {
  item: QuoteItemData;
  equipment: Equipment[];
  onUpdate: (item: QuoteItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const PERIOD_OPTIONS = [
  { value: 1, label: "1-2 dni", start: 1, end: 2 },
  { value: 5, label: "3-7 dni", start: 3, end: 7 },
  { value: 13, label: "8-18 dni", start: 8, end: 18 },
  { value: 24, label: "19-29 dni", start: 19, end: 29 },
  { value: 30, label: "30+ dni", start: 30, end: null },
];

export default function QuoteItem({ item, equipment, onUpdate, onRemove, canRemove }: QuoteItemProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

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

  // Get selected equipment
  const selectedEquipment = equipment.find(eq => eq.id === item.equipmentId);

  // Calculate price when equipment, quantity, or period changes
  useEffect(() => {
    if (selectedEquipment && item.quantity > 0 && item.rentalPeriodDays > 0) {
      const pricing = getPricingForPeriod(selectedEquipment, item.rentalPeriodDays);
      if (pricing) {
        const pricePerDay = parseFloat(pricing.pricePerDay);
        const discountPercent = parseFloat(pricing.discountPercent);
        const totalPrice = pricePerDay * item.quantity * item.rentalPeriodDays;

        onUpdate({
          ...item,
          pricePerDay,
          discountPercent,
          totalPrice,
        });
      }
    }
  }, [item.equipmentId, item.quantity, item.rentalPeriodDays]);

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
    }
    
    onUpdate({
      ...item,
      equipmentId: eqId,
      pricePerDay: 0,
      discountPercent: 0,
      totalPrice: 0,
    });
  };

  const handleQuantityChange = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    onUpdate({
      ...item,
      quantity: qty,
    });
  };

  const handlePeriodChange = (days: string) => {
    const period = parseInt(days);
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
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Sprzęt</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Ilość</label>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Okres wynajmu</label>
            <Select value={item.rentalPeriodDays.toString()} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz okres" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cena netto</label>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">
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

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Uwagi</label>
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
