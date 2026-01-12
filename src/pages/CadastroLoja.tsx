import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, User, BarChart3, Palette, Brain, GitBranch, 
  CheckCircle2, ArrowLeft, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import uopaLogo from "@/assets/uopa-logo-color.png";

// Step components
import { StepIdentidade } from "@/components/onboarding/StepIdentidade";
import { StepResponsavel } from "@/components/onboarding/StepResponsavel";
import { StepOperacao } from "@/components/onboarding/StepOperacao";
import { StepVisual } from "@/components/onboarding/StepVisual";
import { StepIA } from "@/components/onboarding/StepIA";
import { StepFunil } from "@/components/onboarding/StepFunil";
import { StepConcluido } from "@/components/onboarding/StepConcluido";

export interface OnboardingFormData {
  // Step 1 - Identidade
  company_name: string;
  short_name: string;
  slogan: string;
  
  // Step 2 - Responsável
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  owner_is_seller: boolean;
  
  // Step 3 - Operação
  monthly_attendances: number | null;
  catalog_products: number | null;
  whatsapp_numbers: number | null;
  niche: string;
  
  // Step 4 - Visual
  logo_url: string;
  symbol_url: string;
  logo_white_url: string;
  
  // Step 5 - IA
  ai_personality: string;
  working_hours: {
    weekdays: { start: string; end: string };
    saturday: { start: string; end: string };
  };
  ai_respond_outside_hours: boolean;
  
  // Step 6 - Funil
  funnel_stages: string[];
  product_categories: string[];
}

const STEPS = [
  { id: 1, title: "Identidade", icon: Building2 },
  { id: 2, title: "Responsável", icon: User },
  { id: 3, title: "Operação", icon: BarChart3 },
  { id: 4, title: "Visual", icon: Palette },
  { id: 5, title: "IA", icon: Brain },
  { id: 6, title: "Funil", icon: GitBranch },
  { id: 7, title: "Concluído", icon: CheckCircle2 },
];

const DEFAULT_FORM_DATA: OnboardingFormData = {
  company_name: "",
  short_name: "",
  slogan: "",
  owner_name: "",
  owner_email: "",
  owner_phone: "",
  owner_is_seller: false,
  monthly_attendances: null,
  catalog_products: null,
  whatsapp_numbers: null,
  niche: "",
  logo_url: "",
  symbol_url: "",
  logo_white_url: "",
  ai_personality: "",
  working_hours: {
    weekdays: { start: "08:00", end: "18:00" },
    saturday: { start: "09:00", end: "13:00" },
  },
  ai_respond_outside_hours: false,
  funnel_stages: ["Novo Lead", "Qualificando", "Proposta", "Negociação", "Ganho", "Perdido"],
  product_categories: ["Mais Vendidos", "Lançamentos", "Promoções"],
};

export default function CadastroLoja() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const updateFormData = (updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("onboarding_submissions")
        .insert([{
          company_name: formData.company_name || "Sem nome",
          form_data: JSON.parse(JSON.stringify(formData)),
          status: "pending",
        }]);

      if (error) throw error;

      toast.success("Cadastro enviado com sucesso!");
      setCurrentStep(7);
    } catch (error) {
      console.error("Erro ao enviar cadastro:", error);
      toast.error("Erro ao enviar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepIdentidade formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepResponsavel formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepOperacao formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepVisual formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <StepIA formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <StepFunil formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <StepConcluido />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={uopaLogo} 
              alt="Uôpa CRM" 
              className="h-10 w-auto"
            />
          </div>
          
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{currentStep}</span>
            <span>/</span>
            <span>{STEPS.length - 1}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Progress value={progress} className="h-2" />
        
        {/* Step pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.slice(0, -1).map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : isCompleted 
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20" 
                      : "bg-muted text-muted-foreground"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <main className="max-w-4xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation footer */}
      {currentStep < 7 && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            {currentStep < 6 ? (
              <Button onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                {isSubmitting ? "Enviando..." : "Finalizar Cadastro"}
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
