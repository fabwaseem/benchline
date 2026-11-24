import { FaqAccordion } from "@/components/kit/faq-accordion";
import { SectionHeading } from "@/components/site/section-heading";
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
    <section className="grid gap-12 lg:grid-cols-2">
      <div>
        <SectionHeading id="how-to" eyebrow="Guide" title="How it works">
          {description}
        </SectionHeading>
        {steps.length > 0 ? (
          <ol className="mt-5 grid gap-3">
            {steps.map((step, index) => (
              <li key={step.name} className="grid grid-cols-[36px_1fr] gap-3 rounded-xl border border-border bg-surface p-4">
                <span className="grid size-7 place-items-center rounded-md bg-brand-wash font-mono text-[11.5px] font-medium text-brand-text">{index + 1}</span>
                <span>
                  <span className="block text-[14.5px] font-semibold tracking-[-0.01em]">{step.name}</span>
                  <span className="mt-1 block text-[13.5px] leading-[1.55] text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {faqs.length > 0 ? (
        <div>
          <SectionHeading id="questions" eyebrow="FAQ" title="Questions people ask" className="mb-4" />
          <FaqAccordion faqs={faqs} />
        </div>
      ) : null}
    </section>
  );
}
