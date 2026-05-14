export default function CommandQA() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <header>
        <h2 className="text-[20px] font-display tracking-tight text-[hsl(var(--ink-primary))]">
          QA / Tester
        </h2>
        <p className="text-[13px] text-[hsl(var(--ink-secondary))] mt-1">
          Browser real (Browserbase) que visita o uôpa, executa playbooks, captura console,
          network e screenshots. Onda 3B em construção.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-1))] p-8 text-center text-[12.5px] text-[hsl(var(--ink-muted))]">
        Playbooks e histórico de runs aparecem aqui assim que a divisão QA for ativada.
      </div>
    </div>
  );
}
