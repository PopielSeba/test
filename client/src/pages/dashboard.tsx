import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Package, 
  FileText, 
  PlusCircle, 
  Settings, 
  TrendingUp, 
  Users,
  Snowflake,
  Flame,
  Lightbulb,
  Zap,
  Calendar,
  ArrowRight
} from "lucide-react";

interface Quote {
  id: number;
  quoteNumber: string;
  client: {
    companyName: string;
  };
  createdAt: string;
  totalNet: string;
  status: string;
}

interface Equipment {
  id: number;
  name: string;
  category: {
    name: string;
  };
  quantity: number;
  availableQuantity: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const recentQuotes = quotes.slice(0, 3);
  
  // Calculate statistics
  const totalEquipment = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const availableEquipment = equipment.reduce((sum, item) => sum + item.availableQuantity, 0);
  const categoryCounts = equipment.reduce((acc, item) => {
    const categoryName = item.category.name;
    acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(num);
  };

  const quickActions = [
    {
      title: "Utwórz ofertę",
      description: "Stwórz nową ofertę dla klienta",
      icon: PlusCircle,
      color: "bg-blue-500 hover:bg-blue-600",
      path: "/create-quote"
    },
    {
      title: "Katalog sprzętu",
      description: "Przeglądaj dostępny sprzęt",
      icon: Package,
      color: "bg-green-500 hover:bg-green-600", 
      path: "/equipment"
    },
    {
      title: "Lista ofert",
      description: "Zarządzaj utworzonymi ofertami",
      icon: FileText,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/quotes"
    }
  ];

  if (user?.role === 'admin') {
    quickActions.push({
      title: "Panel admina",
      description: "Zarządzaj sprzętem i użytkownikami",
      icon: Settings,
      color: "bg-orange-500 hover:bg-orange-600",
      path: "/admin"
    });
  }

  const categoryIcons = {
    'Klimatyzacje': Snowflake,
    'Nagrzewnice': Flame,
    'Maszty oświetleniowe': Lightbulb,
    'Agregaty prądotwórcze': Zap,
  };

  const categoryColors = {
    'Klimatyzacje': 'bg-blue-100 text-blue-800',
    'Nagrzewnice': 'bg-red-100 text-red-800',
    'Maszty oświetleniowe': 'bg-yellow-100 text-yellow-800',
    'Agregaty prądotwórcze': 'bg-green-100 text-green-800',
  };

  if (quotesLoading || equipmentLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Witaj, {user?.firstName || user?.email}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj ofertami i sprzętem budowlanym
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Szybkie akcje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card 
                  key={action.title}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                  onClick={() => navigate(action.path)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} text-white`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{action.title}</h3>
                        <p className="text-muted-foreground text-sm">{action.description}</p>
                        <ArrowRight className="w-4 h-4 mt-2 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ostatnie oferty</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/quotes")}>
                Zobacz wszystkie
              </Button>
            </CardHeader>
            <CardContent>
              {recentQuotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Brak utworzonych ofert</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate("/create-quote")}
                  >
                    Utwórz pierwszą ofertę
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentQuotes.map((quote) => (
                    <div 
                      key={quote.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <div>
                        <p className="font-medium">{quote.quoteNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.client.companyName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(quote.totalNet)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kategorie sprzętu</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/equipment")}>
                Zobacz katalog
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryCounts).map(([categoryName, count]) => {
                  const IconComponent = categoryIcons[categoryName as keyof typeof categoryIcons] || Package;
                  const colorClass = categoryColors[categoryName as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800';
                  
                  return (
                    <div 
                      key={categoryName}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate("/equipment")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${colorClass} bg-opacity-20`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{categoryName}</span>
                      </div>
                      <Badge variant="secondary">{count} szt.</Badge>
                    </div>
                  );
                })}
                
                {Object.keys(categoryCounts).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Brak sprzętu w systemie</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}