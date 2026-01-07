import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Home, Users, Settings, MessageSquare, BarChart, Bell } from 'lucide-react';
import { BrandingPayload } from '@/services/masterApi';

interface BrandingPreviewProps {
  branding: BrandingPayload;
  onClose: () => void;
}

export function BrandingPreview({ branding, onClose }: BrandingPreviewProps) {
  const getBorderRadius = () => {
    switch (branding.border_radius) {
      case 'none': return '0px';
      case 'sm': return '4px';
      case 'md': return '8px';
      case 'lg': return '12px';
      case 'xl': return '16px';
      case 'full': return '9999px';
      default: return '8px';
    }
  };

  const borderRadius = getBorderRadius();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Preview</Badge>
            <span className="text-sm text-muted-foreground">
              Visualização de como ficará o branding aplicado
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          <div 
            className="min-h-full flex"
            style={{ 
              fontFamily: branding.font_family || 'Inter',
              backgroundColor: branding.background_color || '#ffffff',
            }}
          >
            {/* Sidebar Preview */}
            <div 
              className="w-64 min-h-full p-4 flex flex-col"
              style={{ backgroundColor: branding.primary_color || '#6366f1' }}
            >
              {/* Logo */}
              <div className="mb-8">
                {branding.logo_white_url ? (
                  <img 
                    src={branding.logo_white_url} 
                    alt="Logo" 
                    className="h-8 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {branding.symbol_url ? (
                      <img 
                        src={branding.symbol_url} 
                        alt="Symbol" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 bg-white/20 flex items-center justify-center text-white font-bold"
                        style={{ borderRadius }}
                      >
                        {branding.company_name?.charAt(0) || 'T'}
                      </div>
                    )}
                    <span className="text-white font-semibold">
                      {branding.company_name || 'Empresa'}
                    </span>
                  </div>
                )}
              </div>

              {/* Nav Items */}
              <nav className="flex-1 space-y-1">
                {[
                  { icon: Home, label: 'Dashboard' },
                  { icon: MessageSquare, label: 'Conversas' },
                  { icon: Users, label: 'Leads' },
                  { icon: BarChart, label: 'Relatórios' },
                  { icon: Settings, label: 'Configurações' },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/10 cursor-pointer transition-colors ${i === 0 ? 'bg-white/20' : ''}`}
                    style={{ borderRadius }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </nav>

              {/* Footer */}
              {branding.footer_text && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 text-xs text-center">
                    {branding.footer_text}
                  </p>
                </div>
              )}
            </div>

            {/* Main Content Preview */}
            <div className="flex-1 flex flex-col">
              {/* Top Header */}
              <header 
                className="h-16 border-b flex items-center justify-between px-6"
                style={{ borderColor: `${branding.primary_color}20` }}
              >
                <div className="flex items-center gap-4">
                  <Input 
                    placeholder="Buscar..." 
                    className="w-64"
                    style={{ borderRadius }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    style={{ borderRadius }}
                  >
                    <Bell className="w-5 h-5" style={{ color: branding.text_color }} />
                  </Button>
                  <div 
                    className="w-8 h-8 flex items-center justify-center text-white font-medium"
                    style={{ 
                      backgroundColor: branding.secondary_color,
                      borderRadius 
                    }}
                  >
                    U
                  </div>
                </div>
              </header>

              {/* Content Area */}
              <div className="flex-1 p-6">
                <h1 
                  className="text-2xl font-bold mb-6"
                  style={{ color: branding.text_color }}
                >
                  Dashboard
                </h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Leads Hoje', value: '42', change: '+12%' },
                    { label: 'Conversões', value: '18', change: '+8%' },
                    { label: 'Mensagens', value: '234', change: '+25%' },
                  ].map((stat, i) => (
                    <Card key={i} style={{ borderRadius }}>
                      <CardHeader className="pb-2">
                        <CardTitle 
                          className="text-sm font-medium"
                          style={{ color: branding.text_color }}
                        >
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="text-3xl font-bold"
                            style={{ color: branding.primary_color }}
                          >
                            {stat.value}
                          </span>
                          <span 
                            className="text-sm font-medium"
                            style={{ color: branding.accent_color }}
                          >
                            {stat.change}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Button Samples */}
                <Card style={{ borderRadius }}>
                  <CardHeader>
                    <CardTitle style={{ color: branding.text_color }}>
                      Exemplos de Botões
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button 
                      style={{ 
                        backgroundColor: branding.primary_color,
                        color: '#ffffff',
                        borderRadius 
                      }}
                    >
                      Botão Primário
                    </Button>
                    <Button 
                      variant="outline"
                      style={{ 
                        borderColor: branding.secondary_color,
                        color: branding.secondary_color,
                        borderRadius 
                      }}
                    >
                      Botão Secundário
                    </Button>
                    <Button 
                      style={{ 
                        backgroundColor: branding.accent_color,
                        color: '#ffffff',
                        borderRadius 
                      }}
                    >
                      Botão Destaque
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
