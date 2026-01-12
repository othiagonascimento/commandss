import { CheckCircle2, PartyPopper, Clock, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StepConcluido() {
  return (
    <div className="space-y-6 py-8">
      {/* Success icon */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center animate-pulse">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="w-6 h-6 text-warning" />
            <h2 className="text-2xl font-bold text-foreground">Tudo Pronto!</h2>
            <PartyPopper className="w-6 h-6 text-warning scale-x-[-1]" />
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Recebemos seus dados com sucesso! Nossa equipe vai analisar e configurar 
            seu ambiente personalizado.
          </p>
        </div>
      </div>

      {/* Next steps */}
      <Card className="border-border/50 max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Próximos Passos</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Análise do Cadastro</p>
                <p className="text-xs text-muted-foreground">
                  Nossa equipe vai revisar suas informações em até 24h úteis
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Contato da Equipe</p>
                <p className="text-xs text-muted-foreground">
                  Você receberá um e-mail com os próximos passos e acesso ao sistema
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "https://uopa.com.br"}
          className="gap-2"
        >
          Voltar para o site
        </Button>
      </div>
    </div>
  );
}
