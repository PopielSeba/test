import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Download
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Quote {
  id: number;
  quoteNumber: string;
  client: {
    id: number;
    companyName: string;
  };
  createdBy: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  totalNet: string;
  totalGross: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    quantity: number;
    rentalPeriodDays: number;
    equipment: {
      name: string;
    };
  }>;
}

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(parseFloat(amount));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Wersja robocza', className: 'bg-gray-500 text-white' },
      pending: { label: 'Oczekująca', className: 'bg-warning text-warning-foreground' },
      approved: { label: 'Zatwierdzona', className: 'bg-success text-success-foreground' },
      rejected: { label: 'Odrzucona', className: 'bg-destructive text-destructive-foreground' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getRentalPeriodText = (days: number) => {
    if (days <= 2) return `${days} dni`;
    if (days <= 7) return `${days} dni`;
    if (days <= 18) return `${days} dni`;
    if (days <= 29) return `${days} dni`;
    return `${days}+ dni`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Zarządzanie Wycenami</h1>
            <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj wycenami</p>
          </div>
          <Link href="/create-quote">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nowa Wycena
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Lista Wycen</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Wszystkie statusy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    <SelectItem value="draft">Wersja robocza</SelectItem>
                    <SelectItem value="pending">Oczekująca</SelectItem>
                    <SelectItem value="approved">Zatwierdzona</SelectItem>
                    <SelectItem value="rejected">Odrzucona</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Szukaj wyceny..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr wyceny</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead>Okres wynajmu</TableHead>
                    <TableHead>Wartość netto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {quotes.length === 0 
                          ? "Brak wycen do wyświetlenia"
                          : "Brak wycen pasujących do filtrów"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotes.map((quote) => {
                      const maxPeriod = Math.max(...quote.items.map(item => item.rentalPeriodDays));
                      
                      return (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                          <TableCell>{quote.client.companyName}</TableCell>
                          <TableCell>
                            {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                          </TableCell>
                          <TableCell>{getRentalPeriodText(maxPeriod)}</TableCell>
                          <TableCell>{formatCurrency(quote.totalNet)}</TableCell>
                          <TableCell>{getStatusBadge(quote.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" title="Podgląd">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Edytuj">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Pobierz PDF">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                title="Usuń"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {quotes.length === 0 && (
          <Card className="mt-8 text-center py-12">
            <CardContent>
              <p className="text-gray-500 text-lg mb-4">
                Nie masz jeszcze żadnych wycen
              </p>
              <Link href="/create-quote">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Utwórz pierwszą wycenę
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
