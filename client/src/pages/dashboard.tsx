import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
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
    companyName: string;
  };
  createdAt: string;
  totalNet: string;
  status: string;
}

export default function Dashboard() {


  const { data: quotes, isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const recentQuotes = quotes?.slice(0, 5) || [];

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Wersja robocza', variant: 'secondary' as const },
      pending: { label: 'Oczekująca', variant: 'default' as const },
      approved: { label: 'Zatwierdzona', variant: 'default' as const },
      rejected: { label: 'Odrzucona', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge 
        variant={config.variant}
        className={
          status === 'approved' ? 'bg-success text-success-foreground' :
          status === 'pending' ? 'bg-warning text-warning-foreground' : ''
        }
      >
        {config.label}
      </Badge>
    );
  };

  if (quotesLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Przegląd aktywności systemu</p>
        </div>



        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ostatnie wyceny</CardTitle>
              <Link href="/quotes">
                <Button variant="outline" size="sm">
                  Zobacz wszystkie
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr wyceny</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Wartość</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Brak wycen do wyświetlenia
                    </TableCell>
                  </TableRow>
                ) : (
                  recentQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.client.companyName}</TableCell>
                      <TableCell>
                        {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                      </TableCell>
                      <TableCell>{formatCurrency(quote.totalNet)}</TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
