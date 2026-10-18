import { FaqAccordion } from "@/components/kit/faq-accordion";
import type { Faq, HowToStep } from "@/registry/schema";

export function HowItWorks({
  description,
  steps,
  faqs,
}: {
  description?: string;
  steps: HowToStep[];
  faqs: Faq[];
}) {
  if (steps.length === 0 && faqs.length === 0 && !description) return null;
  return (
    <section className="grid gap-10 min-[900px]:grid-cols-2">
      <div>
        <h2 id="how-to" className="text-[15px] font-medium">How it works</h2>
        {description ? <p className="mt-3 max-w-[62ch] text-[14px] leading-6 text-muted-foreground">{description}</p> : null}
        {steps.length > 0 ? (
          <ol className="mt-4 grid gap-3">
            {steps.map((step, index) => (
              <li key={step.name} className="rounded-xl border border-border bg-surface p-4">
                <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-2 text-[14px] font-medium">{step.name}</p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {faqs.length > 0 ? (
        <div>
          <h2 id="questions" className="mb-2 text-[15px] font-medium">FAQ</h2>
          <FaqAccordion faqs={faqs} />
        </div>
      ) : null}
    </section>
  );
}
