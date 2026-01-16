// Prompt Composition Utility
// Implements intelligent inheritance model with auto-detection

export type PromptMode = 'inherit' | 'extend' | 'override';
export type PromptIntent = 'extend' | 'exclude' | 'override';

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

// Patterns that indicate explicit override (replacement)
const OVERRIDE_PATTERNS = [
  /^(faça|seja|aja|atue|comporte-se|responda)\s/i,   // Imperative start
  /^(você é|você será|seu papel é|seu nome é)/i,     // Identity definition
  /^(sempre|obrigatoriamente|necessariamente)\s/i,   // Mandatory behaviors
];

// Patterns that indicate exclusion (removal from base)
const EXCLUSION_PATTERNS = [
  /^(não|nunca|jamais|evite|ignore|remova)\s/i,      // Negations
  /(não faça|não use|não mencione|não fale)/i,       // Specific prohibitions
  /(sem usar|sem mencionar|sem falar)/i,             // Prohibitions with "sem"
];

/**
 * Detect the intent of a prompt line based on its content
 */
export function detectPromptIntent(line: string): PromptIntent {
  const trimmed = line.trim();
  if (!trimmed) return 'extend';

  // Check exclusion first (higher priority)
  if (EXCLUSION_PATTERNS.some(p => p.test(trimmed))) {
    return 'exclude';
  }

  // Check override
  if (OVERRIDE_PATTERNS.some(p => p.test(trimmed))) {
    return 'override';
  }

  // Default: always extend
  return 'extend';
}

/**
 * Analyze all lines and return categorized results
 */
export function analyzePromptContent(content: string): {
  extends: string[];
  excludes: string[];
  overrides: string[];
} {
  const result = {
    extends: [] as string[],
    excludes: [] as string[],
    overrides: [] as string[],
  };

  const lines = content.trim().split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const intent = detectPromptIntent(trimmed);
    
    switch (intent) {
      case 'exclude':
        result.excludes.push(trimmed);
        break;
      case 'override':
        result.overrides.push(trimmed);
        break;
      default:
        result.extends.push(trimmed);
    }
  }

  return result;
}

/**
 * Extract the target of an exclusion statement
 * "Não use emojis" -> "emojis"
 * "Nunca mencione concorrentes" -> "concorrentes"
 */
export function extractExclusionTarget(line: string): string {
  return line
    .replace(/^(não|nunca|jamais|evite|ignore|remova)\s+/i, '')
    .replace(/(faça|use|mencione|fale sobre|fale de|fale)\s*/i, '')
    .replace(/^(sem usar|sem mencionar|sem falar sobre|sem falar de)\s*/i, '')
    .trim();
}

/**
 * Apply exclusions to a prompt by removing specific patterns or phrases
 */
function applyExclusions(prompt: string, excludes: string[]): string {
  if (!excludes || excludes.length === 0) return prompt;
  
  let result = prompt;
  
  for (const exclusion of excludes) {
    const target = extractExclusionTarget(exclusion);
    if (!target) continue;

    // Create variations of the exclusion pattern
    const patterns = [
      // Exact match (case insensitive)
      new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      // Match sentences containing the target
      new RegExp(`[^.]*${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*\\.`, 'gi'),
      // Match bullet points containing the target
      new RegExp(`[-•*]\\s*[^\\n]*${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*\\n?`, 'gi'),
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
 * Apply smart replacement for override statements
 * Tries to find and replace similar concepts in the base
 */
function applySmartReplacement(base: string, replacement: string): string {
  // For now, just prepend the replacement (it takes priority)
  // In a more sophisticated version, this could identify and replace specific sections
  return `${replacement}\n\n${base}`;
}

/**
 * Smart merge prompt content with intelligent detection
 */
export function smartMergePrompt(base: string, addition: string): string {
  if (!addition.trim()) return base;
  if (!base.trim()) return addition;

  const analysis = analyzePromptContent(addition);
  let result = base;

  // 1. Apply exclusions (remove from base)
  if (analysis.excludes.length > 0) {
    result = applyExclusions(result, analysis.excludes);
  }

  // 2. Apply overrides (prepend to take priority)
  for (const replacement of analysis.overrides) {
    result = applySmartReplacement(result, replacement);
  }

  // 3. Add extensions (append as complementary)
  if (analysis.extends.length > 0) {
    result = `${result}\n\n---\n\n### Complementos Específicos:\n${analysis.extends.join('\n')}`;
  }

  return result;
}

/**
 * Compose prompts by combining base prompts with template-specific additions
 * Now with intelligent auto-detection
 */
export function composePrompts(
  basePrompts: BasePrompts,
  templatePrompts: TemplatePrompts | null | undefined
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
    const templateConfig = templatePrompts?.[section];
    
    // If no template config or no content, inherit base
    if (!templateConfig || !templateConfig.content?.trim()) {
      result[section] = baseContent;
      continue;
    }

    const content = templateConfig.content;

    // If explicitly set to override mode, replace entirely
    if (templateConfig.mode === 'override') {
      result[section] = content;
      continue;
    }

    // Default behavior: intelligent merge
    result[section] = smartMergePrompt(baseContent, content);
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
    
    // For legacy content, use intelligent merge instead of pure override
    if (legacyContent && typeof legacyContent === 'string' && legacyContent.trim()) {
      result[section] = smartMergePrompt(baseContent, legacyContent);
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
