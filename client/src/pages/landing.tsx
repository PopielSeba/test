import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Calculator, FileText, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white mb-16">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Settings className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">REKORD</h1>
            <p className="text-xl opacity-90">System Wycen Sprzętu Budowlanego</p>
          </div>
          
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Profesjonalny system do zarządzania wyceną wynajmu sprzętu budowlanego. 
            Automatyczne naliczanie rabatów, kompleksowe zarządzanie katalogiem i generowanie ofert PDF.
          </p>

          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Zaloguj się do systemu
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">Automatyczne Wyceny</h3>
              <p className="text-sm opacity-80">Kalkulacja cen z automatycznym naliczaniem rabatów według okresu wynajmu</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">Zarządzanie Sprzętem</h3>
              <p className="text-sm opacity-80">Kompletny katalog sprzętu z różnych kategorii budowlanych</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">Generowanie PDF</h3>
              <p className="text-sm opacity-80">Profesjonalne oferty PDF gotowe do wysłania klientom</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">Zespołowa Praca</h3>
              <p className="text-sm opacity-80">System ról i uprawnień dla zespołu pracowników</p>
            </CardContent>
          </Card>
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
