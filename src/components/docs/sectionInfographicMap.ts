import type { ComponentType } from 'react';
import { LoopDiagram } from './infographics/LoopDiagram';
import { PrimitivasGrid } from './infographics/PrimitivasGrid';
import { FlywheelDiagram } from './infographics/FlywheelDiagram';
import { MoatLayers } from './infographics/MoatLayers';
import { JourneyTimeline } from './infographics/JourneyTimeline';
import { ArchitectureStack } from './infographics/ArchitectureStack';
import { PerdasInvisiveis } from './infographics/PerdasInvisiveis';
import { ManifestoSpread } from './infographics/ManifestoSpread';
import { PosicionamentoQuad } from './infographics/PosicionamentoQuad';
import { VisaoLongoPrazo } from './infographics/VisaoLongoPrazo';

export const sectionInfographics: Record<string, ComponentType> = {
  'definicao-central': JourneyTimeline,
  'loop-operacional': LoopDiagram,
  'primitivas': PrimitivasGrid,
  'tese-economica': PerdasInvisiveis,
  'manifesto': ManifestoSpread,
  'flywheel': FlywheelDiagram,
  'moat': MoatLayers,
  'posicionamento': PosicionamentoQuad,
  'visao-longo-prazo': VisaoLongoPrazo,
  'arquitetura-global': ArchitectureStack,
  'topologia-infra-externa': ArchitectureStack,
  'plano-controle-cognitivo': ArchitectureStack,
};

// Variantes visuais do cabeçalho de capítulo (cicla por número)
export type ChapterVariant = 'side-num' | 'banner-num' | 'split-eyebrow';

export function variantFor(num: number | null, sectionId: string): ChapterVariant {
  if (num === null) return 'split-eyebrow';
  // Capítulos com infográfico hero ganham banner-num para impacto
  if (sectionId === 'manifesto' || sectionId === 'flywheel' || sectionId === 'visao-longo-prazo') {
    return 'banner-num';
  }
  const cycle = num % 3;
  if (cycle === 0) return 'banner-num';
  if (cycle === 1) return 'side-num';
  return 'split-eyebrow';
}
