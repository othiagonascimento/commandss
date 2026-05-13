import type { ComponentType } from 'react';
import { LoopDiagram } from './infographics/LoopDiagram';
import { PrimitivasGrid } from './infographics/PrimitivasGrid';
import { FlywheelDiagram } from './infographics/FlywheelDiagram';
import { MoatLayers } from './infographics/MoatLayers';
import { JourneyTimeline } from './infographics/JourneyTimeline';
import { ArchitectureStack } from './infographics/ArchitectureStack';

// Mapeia sectionId → infográfico que aparece no topo do capítulo
export const sectionInfographics: Record<string, ComponentType> = {
  'definicao-central': JourneyTimeline,
  'loop-operacional': LoopDiagram,
  'primitivas': PrimitivasGrid,
  'flywheel': FlywheelDiagram,
  'moat': MoatLayers,
  'arquitetura-global': ArchitectureStack,
  'topologia-infra-externa': ArchitectureStack,
  'plano-controle-cognitivo': ArchitectureStack,
};
