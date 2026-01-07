import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, X, Package, BookOpen, Users, Trash2, DollarSign } from "lucide-react";
import { Product, KnowledgeArticle, Competitor } from "@/types/templates";
import { useState } from "react";

interface CatalogKnowledgeEditorProps {
  products: Product[];
  knowledgeArticles: KnowledgeArticle[];
  competitors: Competitor[];
  onChange: (data: {
    products: Product[];
    knowledgeArticles: KnowledgeArticle[];
    competitors: Competitor[];
  }) => void;
}

export function CatalogKnowledgeEditor({
  products,
  knowledgeArticles,
  competitors,
  onChange
}: CatalogKnowledgeEditorProps) {
  const [activeTab, setActiveTab] = useState("products");
  const [newBenefit, setNewBenefit] = useState<Record<string, string>>({});
  const [newObjection, setNewObjection] = useState<Record<string, string>>({});
  const [newDifferentiator, setNewDifferentiator] = useState<Record<string, string>>({});

  // Products
  const addProduct = () => {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: "Novo Produto",
      description: "",
      price_range: { min: 0, max: 0 },
      benefits: [],
      common_objections: [],
      complementary_products: [],
      faq: []
    };
    onChange({ products: [...products, newProduct], knowledgeArticles, competitors });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    onChange({
      products: products.map(p => p.id === id ? { ...p, ...updates } : p),
      knowledgeArticles,
      competitors
    });
  };

  const removeProduct = (id: string) => {
    onChange({
      products: products.filter(p => p.id !== id),
      knowledgeArticles,
      competitors
    });
  };

  // Knowledge Articles
  const addKnowledgeArticle = () => {
    const newArticle: KnowledgeArticle = {
      id: `ka_${Date.now()}`,
      title: "Novo Artigo",
      content: "",
      category: "geral",
      tags: []
    };
    onChange({ products, knowledgeArticles: [...knowledgeArticles, newArticle], competitors });
  };

  const updateKnowledgeArticle = (id: string, updates: Partial<KnowledgeArticle>) => {
    onChange({
      products,
      knowledgeArticles: knowledgeArticles.map(a => a.id === id ? { ...a, ...updates } : a),
      competitors
    });
  };

  const removeKnowledgeArticle = (id: string) => {
    onChange({
      products,
      knowledgeArticles: knowledgeArticles.filter(a => a.id !== id),
      competitors
    });
  };

  // Competitors
  const addCompetitor = () => {
    const newCompetitor: Competitor = {
      id: `comp_${Date.now()}`,
      name: "Novo Concorrente",
      differentiators: [],
      response_when_mentioned: ""
    };
    onChange({ products, knowledgeArticles, competitors: [...competitors, newCompetitor] });
  };

  const updateCompetitor = (id: string, updates: Partial<Competitor>) => {
    onChange({
      products,
      knowledgeArticles,
      competitors: competitors.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };

  const removeCompetitor = (id: string) => {
    onChange({
      products,
      knowledgeArticles,
      competitors: competitors.filter(c => c.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="products" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-1 hidden sm:inline" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
            Conhecimento
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1 hidden sm:inline" />
            Concorrentes
          </TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Produtos e Serviços</h3>
              <p className="text-sm text-muted-foreground">Catálogo completo com informações para a IA</p>
            </div>
            <Button onClick={addProduct} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {products.map((product) => (
              <AccordionItem key={product.id} value={product.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.price_range.min > 0 && (
                        <div className="text-xs text-muted-foreground">
                          R$ {product.price_range.min} - R$ {product.price_range.max}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Faixa de Preço (R$)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Mín"
                            value={product.price_range.min || ""}
                            onChange={(e) => updateProduct(product.id, {
                              price_range: { ...product.price_range, min: parseFloat(e.target.value) || 0 }
                            })}
                          />
                          <Input
                            type="number"
                            placeholder="Máx"
                            value={product.price_range.max || ""}
                            onChange={(e) => updateProduct(product.id, {
                              price_range: { ...product.price_range, max: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                        placeholder="Descrição detalhada do produto..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Benefícios</Label>
                      <div className="flex flex-wrap gap-2">
                        {product.benefits.map((benefit, i) => (
                          <Badge key={i} variant="secondary" className="py-1.5">
                            {benefit}
                            <button
                              onClick={() => updateProduct(product.id, {
                                benefits: product.benefits.filter((_, idx) => idx !== i)
                              })}
                              className="ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Novo benefício..."
                          value={newBenefit[product.id] || ""}
                          onChange={(e) => setNewBenefit({ ...newBenefit, [product.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newBenefit[product.id]?.trim()) {
                              updateProduct(product.id, {
                                benefits: [...product.benefits, newBenefit[product.id].trim()]
                              });
                              setNewBenefit({ ...newBenefit, [product.id]: "" });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newBenefit[product.id]?.trim()) {
                              updateProduct(product.id, {
                                benefits: [...product.benefits, newBenefit[product.id].trim()]
                              });
                              setNewBenefit({ ...newBenefit, [product.id]: "" });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Objeções Comuns</Label>
                      <div className="flex flex-wrap gap-2">
                        {product.common_objections.map((objection, i) => (
                          <Badge key={i} variant="outline" className="py-1.5">
                            {objection}
                            <button
                              onClick={() => updateProduct(product.id, {
                                common_objections: product.common_objections.filter((_, idx) => idx !== i)
                              })}
                              className="ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nova objeção comum..."
                          value={newObjection[product.id] || ""}
                          onChange={(e) => setNewObjection({ ...newObjection, [product.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newObjection[product.id]?.trim()) {
                              updateProduct(product.id, {
                                common_objections: [...product.common_objections, newObjection[product.id].trim()]
                              });
                              setNewObjection({ ...newObjection, [product.id]: "" });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (newObjection[product.id]?.trim()) {
                              updateProduct(product.id, {
                                common_objections: [...product.common_objections, newObjection[product.id].trim()]
                              });
                              setNewObjection({ ...newObjection, [product.id]: "" });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover Produto
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {products.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Knowledge Base */}
        <TabsContent value="knowledge" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Base de Conhecimento</h3>
              <p className="text-sm text-muted-foreground">Artigos e informações para a IA consultar</p>
            </div>
            <Button onClick={addKnowledgeArticle} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {knowledgeArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={article.title}
                        onChange={(e) => updateKnowledgeArticle(article.id, { title: e.target.value })}
                        placeholder="Título do artigo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input
                        value={article.category}
                        onChange={(e) => updateKnowledgeArticle(article.id, { category: e.target.value })}
                        placeholder="Ex: Políticas, FAQ, Processos..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={article.content}
                      onChange={(e) => updateKnowledgeArticle(article.id, { content: e.target.value })}
                      placeholder="Conteúdo do artigo de conhecimento..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeKnowledgeArticle(article.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {knowledgeArticles.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum artigo cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="pt-4">
            <Label className="mb-2 block">Artigos Sugeridos</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { title: "Política de Devolução", category: "Políticas" },
                { title: "Política de Garantia", category: "Políticas" },
                { title: "Formas de Pagamento", category: "FAQ" },
                { title: "Prazos de Entrega", category: "FAQ" },
                { title: "Sobre a Empresa", category: "Institucional" },
                { title: "Cases de Sucesso", category: "Institucional" }
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => {
                    const newArticle: KnowledgeArticle = {
                      id: `ka_${Date.now()}_${i}`,
                      title: suggestion.title,
                      content: "",
                      category: suggestion.category,
                      tags: []
                    };
                    onChange({ products, knowledgeArticles: [...knowledgeArticles, newArticle], competitors });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{suggestion.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Competitors */}
        <TabsContent value="competitors" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Concorrentes</h3>
              <p className="text-sm text-muted-foreground">Como responder quando mencionados</p>
            </div>
            <Button onClick={addCompetitor} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {competitors.map((competitor) => (
              <Card key={competitor.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Concorrente</Label>
                    <Input
                      value={competitor.name}
                      onChange={(e) => updateCompetitor(competitor.id, { name: e.target.value })}
                      placeholder="Nome da empresa concorrente"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Nossos Diferenciais</Label>
                    <div className="flex flex-wrap gap-2">
                      {competitor.differentiators.map((diff, i) => (
                        <Badge key={i} variant="secondary" className="py-1.5">
                          {diff}
                          <button
                            onClick={() => updateCompetitor(competitor.id, {
                              differentiators: competitor.differentiators.filter((_, idx) => idx !== i)
                            })}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nosso diferencial vs este concorrente..."
                        value={newDifferentiator[competitor.id] || ""}
                        onChange={(e) => setNewDifferentiator({ ...newDifferentiator, [competitor.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newDifferentiator[competitor.id]?.trim()) {
                            updateCompetitor(competitor.id, {
                              differentiators: [...competitor.differentiators, newDifferentiator[competitor.id].trim()]
                            });
                            setNewDifferentiator({ ...newDifferentiator, [competitor.id]: "" });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newDifferentiator[competitor.id]?.trim()) {
                            updateCompetitor(competitor.id, {
                              differentiators: [...competitor.differentiators, newDifferentiator[competitor.id].trim()]
                            });
                            setNewDifferentiator({ ...newDifferentiator, [competitor.id]: "" });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Como Responder Quando Mencionado</Label>
                    <Textarea
                      value={competitor.response_when_mentioned}
                      onChange={(e) => updateCompetitor(competitor.id, { response_when_mentioned: e.target.value })}
                      placeholder="Estratégia de resposta quando cliente menciona este concorrente..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCompetitor(competitor.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {competitors.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum concorrente cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
