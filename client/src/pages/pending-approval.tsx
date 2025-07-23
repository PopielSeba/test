import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface PendingApprovalProps {
  user: User;
}

export default function PendingApproval({ user }: PendingApprovalProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: "Oczekiwanie na zatwierdzenie",
          message: "Twoje konto zostało utworzone i oczekuje na zatwierdzenie przez administratora.",
          color: "text-yellow-600"
        };
      case 'rejected':
        return {
          title: "Dostęp odrzucony",
          message: "Niestety, Twoje konto nie zostało zatwierdzone. Skontaktuj się z administratorem.",
          color: "text-red-600"
        };
      default:
        return {
          title: "Nieznany status",
          message: "Skontaktuj się z administratorem w sprawie statusu konta.",
          color: "text-gray-600"
        };
    }
  };

  const statusInfo = getStatusMessage(user.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className={`text-xl ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Witaj, {user.firstName} {user.lastName}!
          </p>
          <p className="text-sm text-gray-500">
            {statusInfo.message}
          </p>
          
          <div className="bg-gray-100 p-3 rounded-lg text-left">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {user.status === 'pending' ? 'Oczekuje' : user.status === 'rejected' ? 'Odrzucone' : user.status}
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj się
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}