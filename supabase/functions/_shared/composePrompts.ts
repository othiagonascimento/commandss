// Prompt Composition Utility
// Implements intelligent inheritance model for prompt composition

export type PromptMode = 'inherit' | 'extend' | 'override';

export interface PromptSection {
  mode: PromptMode;
  content: string;
  excludes?: string[];
}

export interface TemplatePrompts {
  system_prompt?: PromptSection;
  greeting?: PromptSection;
  qualification_criteria?: PromptSection;
  objection_handlers?: PromptSection;
  closing_techniques?: PromptSection;
  follow_up_rules?: PromptSection;
  [key: string]: PromptSection | undefined;
}

export interface BasePrompts {
  system_prompt_base?: string;
  greeting_base?: string;
  qualification_criteria_base?: string;
  objection_handlers_base?: string;
  closing_techniques_base?: string;
  follow_up_rules_base?: string;
  [key: string]: string | undefined;
}

export interface ComposedPrompts {
  [key: string]: string;
}

/**
 * Apply exclusions to a prompt by removing specific patterns or phrases
 */
function applyExclusions(prompt: string, excludes: string[]): string {
  if (!excludes || excludes.length === 0) return prompt;
  
  let result = prompt;
  
  for (const exclusion of excludes) {
    // Create variations of the exclusion pattern
    const patterns = [
      // Exact match (case insensitive)
      new RegExp(exclusion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      // Match sentences containing the exclusion
      new RegExp(`[^.]*${exclusion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*\\.`, 'gi'),
      // Match bullet points containing the exclusion
      new RegExp(`[-•*]\\s*[^\\n]*${exclusion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*\\n?`, 'gi'),
    ];
    
    for (const pattern of patterns) {
      result = result.replace(pattern, '');
    }
  }
  
  // Clean up extra newlines and whitespace
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  
  return result;
}

/**
 * Compose prompts by combining base prompts with template-specific additions
 * 
 * Modes:
 * - inherit: Use base prompt exactly as-is
 * - extend: Append template content to base prompt (default behavior)
 * - override: Replace base prompt entirely with template content
 */
export function composePrompts(
  basePrompts: BasePrompts,
  templatePrompts: TemplatePrompts | null | undefined
): ComposedPrompts {
  const result: ComposedPrompts = {};
  
  // Get all prompt sections from base prompts
  const sections = [
    'system_prompt',
    'greeting',
    'qualification_criteria',
    'objection_handlers',
    'closing_techniques',
    'follow_up_rules',
  ];
  
  for (const section of sections) {
    const baseKey = `${section}_base`;
    const baseContent = basePrompts[baseKey] || '';
    const templateConfig = templatePrompts?.[section];
    
    // If no template config, inherit base
    if (!templateConfig || !templateConfig.mode) {
      result[section] = baseContent;
      continue;
    }
    
    switch (templateConfig.mode) {
      case 'inherit':
        // Use base prompt exactly
        result[section] = baseContent;
        break;
        
      case 'extend':
        // Combine base with template additions
        let composed = baseContent;
        
        if (templateConfig.content && templateConfig.content.trim()) {
          composed = `${baseContent}\n\n---\n\nAdições específicas do template:\n\n${templateConfig.content}`;
        }
        
        // Apply exclusions if any
        if (templateConfig.excludes && templateConfig.excludes.length > 0) {
          composed = applyExclusions(composed, templateConfig.excludes);
        }
        
        result[section] = composed;
        break;
        
      case 'override':
        // Replace entirely with template content
        result[section] = templateConfig.content || baseContent;
        break;
        
      default:
        // Default to inheritance
        result[section] = baseContent;
    }
  }
  
  return result;
}

/**
 * Legacy format support: Convert old-style prompts to composed prompts
 * This handles backward compatibility when prompts are stored as plain strings
 */
export function composePromptsLegacy(
  basePrompts: BasePrompts,
  legacyPrompts: Record<string, string> | null | undefined
): ComposedPrompts {
  const result: ComposedPrompts = {};
  
  const sections = [
    'system_prompt',
    'greeting',
    'qualification_criteria',
    'objection_handlers',
    'closing_techniques',
    'follow_up_rules',
  ];
  
  for (const section of sections) {
    const baseKey = `${section}_base`;
    const baseContent = basePrompts[baseKey] || '';
    const legacyContent = legacyPrompts?.[section];
    
    // If legacy content exists and is non-empty, use it (override behavior)
    // Otherwise, use base
    if (legacyContent && typeof legacyContent === 'string' && legacyContent.trim()) {
      result[section] = legacyContent;
    } else {
      result[section] = baseContent;
    }
  }
  
  return result;
}

/**
 * Detect if prompts are in new composition format or legacy format
 */
export function isCompositionFormat(prompts: unknown): prompts is TemplatePrompts {
  if (!prompts || typeof prompts !== 'object') return false;
  
  const obj = prompts as Record<string, unknown>;
  const firstValue = Object.values(obj)[0];
  
  // If the first value has a 'mode' property, it's in composition format
  if (firstValue && typeof firstValue === 'object' && 'mode' in (firstValue as object)) {
    return true;
  }
  return false;
}

/**
 * Smart compose that handles both legacy and new formats
 */
export function smartComposePrompts(
  basePrompts: BasePrompts,
  templatePrompts: unknown
): ComposedPrompts {
  if (isCompositionFormat(templatePrompts)) {
    return composePrompts(basePrompts, templatePrompts);
  } else {
    return composePromptsLegacy(basePrompts, templatePrompts as Record<string, string>);
  }
}
