import { Button } from "@/components/ui/button";
import { Settings, Calculator } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white mb-16">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Settings className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Sebastian Popiel :: PPP :: Program</h1>
            <p className="text-xl opacity-90">system wycen</p>
          </div>
          


          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">
              Dostęp wymaga logowania
            </h2>
            <p className="text-white/80 mb-4">
              Aby uzyskać dostęp do systemu zarządzania wynajmem sprzętu, konieczne jest zalogowanie się przez Replit.
            </p>
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Zaloguj się do systemu
            </Button>
          </div>
        </div>



        <div className="mt-16 text-center text-white/80">
          <p className="text-sm">
            Bezpieczny system logowania przez Replit Auth
          </p>
        </div>
      </div>
    </div>
  );
}
