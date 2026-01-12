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
    sunday: { start: string; end: string; enabled: boolean };
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
    sunday: { start: "", end: "", enabled: false },
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

  const totalSteps = STEPS.length - 1; // Exclude "Concluído" from count
  const progress = ((currentStep - 1) / totalSteps) * 100;

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

  const isLastStep = currentStep === 6;
  const isCompleted = currentStep === 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header - Centered logo */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-center">
          <img 
            src={uopaLogo} 
            alt="Uôpa CRM" 
            className="h-9 w-auto"
          />
        </div>
      </header>

      {/* Progress section - mobile optimized */}
      {!isCompleted && (
        <div className="max-w-lg mx-auto px-5 pt-4 pb-2">
          {/* Progress text */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Passo {currentStep} de {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <Progress value={progress} className="h-2" />
          
          {/* Step pills - mobile: icons only with larger touch area */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {STEPS.slice(0, -1).map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isStepCompleted = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`
                    flex items-center justify-center gap-2 
                    min-w-[44px] min-h-[44px] px-3 py-2
                    rounded-full text-sm font-medium whitespace-nowrap
                    transition-all duration-200 snap-center
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : isStepCompleted 
                        ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 active:scale-95" 
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step content - increased padding for mobile */}
      <main className="max-w-lg mx-auto px-5 pb-36 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation footer - safe area for mobile */}
      {!isCompleted && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="min-h-[48px] min-w-[100px] gap-2 text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden xs:inline">Voltar</span>
            </Button>

            {!isLastStep ? (
              <Button 
                onClick={handleNext} 
                className="min-h-[48px] flex-1 max-w-[200px] gap-2 text-base shadow-lg shadow-primary/20"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="min-h-[48px] flex-1 max-w-[200px] gap-2 text-base bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? "Enviando..." : "Finalizar"}
                <CheckCircle2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
