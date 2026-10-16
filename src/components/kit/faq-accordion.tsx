import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Faq } from "@/registry/schema";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  return (
    <Accordion className="border-t border-border">
      {faqs.map((faq) => (
        <AccordionItem key={faq.q} value={faq.q}>
          <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">{faq.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
