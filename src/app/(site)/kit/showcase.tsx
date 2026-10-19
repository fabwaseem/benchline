"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/kit/primitives/accordion";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/kit/primitives/alert-dialog";
import { Badge } from "@/components/kit/primitives/badge";
import { Button, buttonVariants } from "@/components/kit/primitives/button";
import { ButtonGroup } from "@/components/kit/primitives/button-group";
import { Callout } from "@/components/kit/primitives/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/kit/primitives/card";
import { Checkbox } from "@/components/kit/primitives/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/kit/primitives/collapsible";
import { ColorPicker, ColorSwatch } from "@/components/kit/primitives/color-picker";
import { Combobox } from "@/components/kit/primitives/combobox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/kit/primitives/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/kit/primitives/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/kit/primitives/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/kit/primitives/dropdown-menu";
import { Field } from "@/components/kit/primitives/field";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Input } from "@/components/kit/primitives/input";
import { NumberInput } from "@/components/kit/primitives/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/kit/primitives/popover";
import { Progress } from "@/components/kit/primitives/progress";
import { RadioGroup } from "@/components/kit/primitives/radio-group";
import { ScrollArea } from "@/components/kit/primitives/scroll-area";
import { SelectField } from "@/components/kit/primitives/select-field";
import { Separator } from "@/components/kit/primitives/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/kit/primitives/sheet";
import { Skeleton } from "@/components/kit/primitives/skeleton";
import { Slider } from "@/components/kit/primitives/slider";
import { Spinner } from "@/components/kit/primitives/spinner";
import { Switch } from "@/components/kit/primitives/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/kit/primitives/tabs";
import { Textarea } from "@/components/kit/primitives/textarea";
import { toast } from "@/components/kit/primitives/toast";
import { Toggle } from "@/components/kit/primitives/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/kit/primitives/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/kit/primitives/tooltip";
import { EmptyState } from "@/components/kit/empty-state";
import { Kbd } from "@/components/kit/kbd";
import { SegmentedControl } from "@/components/kit/segmented";
import { Tag } from "@/components/kit/tag";
import { CompactFilePill } from "@/components/kit/upload/compact-file-pill";
import { Dropzone } from "@/components/kit/upload/dropzone";
import { ImageUpload } from "@/components/kit/upload/image-upload";
import { LogoDrop } from "@/components/kit/upload/logo-drop";
import { MultiFileList } from "@/components/kit/upload/multi-file-list";
import { PdfUpload } from "@/components/kit/upload/pdf-upload";
import { cn } from "@/lib/utils";

const variants = ["primary", "solid", "outline", "ghost", "destructive", "link"] as const;
const sizes = ["sm", "md", "lg"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border py-6">
      <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Board({ theme, image, logo, pdf }: { theme: "light" | "dark"; image: File | null; logo: File | null; pdf: File | null }) {
  const [text, setText] = useState("Benchline");
  const [note, setNote] = useState("A quiet bench.");
  const [count, setCount] = useState<number | null>(12);
  const [on, setOn] = useState(true);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("a");
  const [range, setRange] = useState<number[]>([64]);
  const [span, setSpan] = useState<number[]>([20, 80]);
  const [tab, setTab] = useState("week");
  const [color, setColor] = useState("#E8590C");
  const [choice, setChoice] = useState("one");
  const [combo, setCombo] = useState<string | null>("teal");
  const [files, setFiles] = useState([
    { id: "a", name: "report-q3.pdf", meta: "12 pages", progress: 100 },
    { id: "b", name: "design-system.pdf", meta: "12 pages", progress: 75 },
    { id: "c", name: "api-spec.pdf", meta: "12 pages", error: "File too large. Maximum 10 MB." },
  ]);
  const [shotOverride, setShotOverride] = useState<File | null | undefined>(undefined);
  const [markOverride, setMarkOverride] = useState<File | null | undefined>(undefined);
  const [docOverride, setDocOverride] = useState<File | null | undefined>(undefined);
  const shot = shotOverride === undefined ? image : shotOverride;
  const mark = markOverride === undefined ? logo : markOverride;
  const doc = docOverride === undefined ? pdf : docOverride;

  return (
    <div className={cn(theme === "light" ? "kit-light" : "kit-dark", "bg-background text-foreground")}>
      <div className="mx-auto max-w-[1100px] px-4 py-8">
        <p className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">{theme}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Design system</h1>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            {variants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="outline" disabled>
              Disabled
            </Button>
            <IconButton label="Edit" variant="outline">
              <Pencil />
            </IconButton>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sizes.map((size) => (
              <Button key={size} size={size} variant="solid">
                {size}
              </Button>
            ))}
            <ButtonGroup>
              <Button size="sm" variant="outline">
                Cut
              </Button>
              <Button size="sm" variant="outline">
                Copy
              </Button>
            </ButtonGroup>
          </div>
        </Section>

        <Section title="Toggle, segmented, tabs">
          <div className="flex flex-wrap items-center gap-3">
            <Toggle pressed={on} onPressedChange={setOn}>
              Pressed
            </Toggle>
            <ToggleGroup value={["left"]} onValueChange={() => undefined}>
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
            <SegmentedControl
              label="Range"
              value={tab}
              onChange={setTab}
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
          </div>
          <Tabs defaultValue="day">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
            <TabsContent value="day">Day panel</TabsContent>
            <TabsContent value="week">Week panel</TabsContent>
          </Tabs>
        </Section>

        <Section title="Fields">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label" hint="Hint text" required>
              <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Enter text…" prefix={<Pencil />} kbd="⌘K" clearable onClear={() => setText("")} />
            </Field>
            <Field label="Invalid" error="This field is required.">
              <Input aria-invalid value="" placeholder="Error state" />
            </Field>
            <Field label="Notes">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} autosize showCount maxLength={80} />
            </Field>
            <Field label="Amount" hint="Steps of 1">
              <NumberInput value={count} onValueChange={setCount} min={0} max={40} unit="px" aria-label="Amount" />
            </Field>
          </div>
        </Section>

        <Section title="Select and menu">
          <div className="flex flex-wrap items-start gap-3">
            <SelectField
              label="Group"
              value={choice}
              onValueChange={setChoice}
              options={[
                { value: "one", label: "Option 1", group: "Group 1" },
                { value: "two", label: "Option 2", group: "Group 1" },
                { value: "three", label: "Option 3", group: "Group 2" },
              ]}
            />
            <Combobox
              label="Color"
              value={combo}
              onValueChange={setCombo}
              options={[
                { value: "orange", label: "Orange" },
                { value: "teal", label: "Teal" },
                { value: "ink", label: "Ink" },
              ]}
            />
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "md" }))}>Open menu</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Pencil /> Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Inbox</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuCheckboxItem checked>Pinned</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value="list">
                  <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ContextMenu>
              <ContextMenuTrigger className="grid h-control-lg place-items-center rounded-sm border border-dashed border-border px-4 text-[13px] text-muted-foreground">
                Right click
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Copy</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </Section>

        <Section title="Choice controls">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-[13px]">
              <Checkbox checked={checked} onCheckedChange={(next) => setChecked(Boolean(next))} />
              Enable feature
            </label>
            <RadioGroup label="Choice" value={radio} onValueChange={setRadio} options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]} className="flex-row" />
            <Switch checked={on} onCheckedChange={setOn} aria-label="Notifications" />
            <Switch checked={false} disabled aria-label="Disabled" />
          </div>
          <Slider value={range} onValueChange={(next) => setRange(Array.isArray(next) ? [...next] : [next])} showValue aria-label="Volume" />
          <Slider value={span} onValueChange={(next) => setSpan(Array.isArray(next) ? [...next] : [next])} aria-label="Range" />
        </Section>

        <Section title="Color">
          <div className="flex items-center gap-3">
            <ColorPicker value={color} onValueChange={setColor} label="Accent" />
            <ColorSwatch color={color} />
            <span className="font-mono text-[12px]">{color}</span>
          </div>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "md" }))}>Popover</PopoverTrigger>
              <PopoverContent>Helpful detail.</PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger className={cn(buttonVariants({ variant: "solid", size: "md" }))}>Tooltip</TooltipTrigger>
              <TooltipContent>This is a helpful tooltip</TooltipContent>
            </Tooltip>
            <Dialog>
              <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "md" }))}>Dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Title</DialogTitle>
                <DialogDescription>Short explanation.</DialogDescription>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger className={cn(buttonVariants({ variant: "destructive", size: "md" }))}>Alert</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "md" }))}>Sheet</SheetTrigger>
              <SheetContent>
                <SheetTitle>Sheet</SheetTitle>
              </SheetContent>
            </Sheet>
            <Drawer>
              <DrawerTrigger className={cn(buttonVariants({ variant: "outline", size: "md" }))}>Drawer</DrawerTrigger>
              <DrawerContent>
                <DrawerTitle>Drawer</DrawerTitle>
              </DrawerContent>
            </Drawer>
            <Button variant="outline" onClick={() => toast("Saved")}>
              Toast
            </Button>
          </div>
          <Accordion>
            <AccordionItem value="one">
              <AccordionTrigger>Accordion</AccordionTrigger>
              <AccordionContent>Hidden until opened.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Collapsible>
            <CollapsibleTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Collapsible</CollapsibleTrigger>
            <CollapsibleContent className="text-[13px] text-muted-foreground">More detail.</CollapsibleContent>
          </Collapsible>
        </Section>

        <Section title="Chrome">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>feature</Badge>
            <Badge variant="mono">new</Badge>
            <Tag>mono</Tag>
            <Kbd>⌘K</Kbd>
            <Spinner />
            <Skeleton className="h-control-md w-24" />
          </div>
          <Progress value={75} label="Upload" />
          <Separator />
          <ScrollArea className="h-16 rounded-sm border border-border p-2 text-[13px]">
            <p>Scrollable copy sits inside the area so long notes stay in the pane.</p>
            <p>A second line keeps the thumb honest.</p>
          </ScrollArea>
          <Callout tone="warn" title="Heads up" body="Check the file size before you upload." />
          <EmptyState title="Nothing here" hint="Drop a file to start." />
          <Card>
            <CardHeader>
              <CardTitle>Card</CardTitle>
            </CardHeader>
            <CardContent className="text-[13px] text-muted-foreground">6px radius, token border.</CardContent>
          </Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Primary</TableCell>
                <TableCell>Ready</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Uploaders">
          <div className="grid gap-4 lg:grid-cols-2">
            <Dropzone label="Drop files here or browse" hint=".png, .jpg, .pdf (10 MB limit)" accept="image/*,.pdf" onFile={() => undefined} />
            <Dropzone label="Drop files here or browse" active accept="image/*" onFile={() => undefined} />
            <ImageUpload file={shot} onFile={setShotOverride} aspect="16 / 9" />
            <PdfUpload file={doc} onFile={setDocOverride} />
            <LogoDrop file={mark} onFile={setMarkOverride} />
            <div className="flex flex-col gap-2">
              <CompactFilePill name="invoice.pdf" onRemove={() => undefined} />
              <MultiFileList
                items={files}
                onRemove={(id) => setFiles((current) => current.filter((item) => item.id !== id))}
                onReorder={(from, to) =>
                  setFiles((current) => {
                    const next = [...current];
                    const [moved] = next.splice(from, 1);
                    if (!moved) return current;
                    next.splice(to, 0, moved);
                    return next;
                  })
                }
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export function KitShowcase() {
  const [image, setImage] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d");
    if (!context) return;
    const wash = context.createLinearGradient(0, 0, 320, 180);
    wash.addColorStop(0, "#E8590C");
    wash.addColorStop(1, "#16130F");
    context.fillStyle = wash;
    context.fillRect(0, 0, 320, 180);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setImage(new File([blob], "hero-image.jpg", { type: "image/jpeg" }));
      setLogo(new File([blob], "logo.png", { type: "image/png" }));
    }, "image/jpeg");
  }, []);
  const pdf = useMemo(() => {
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 240 160] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    ];
    const stream = "BT /F1 18 Tf 24 90 Td (Benchline) Tj ET\n";
    objects.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);
    objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
    let body = "%PDF-1.4\n";
    const offsets = [0];
    for (const object of objects) {
      offsets.push(new TextEncoder().encode(body).length);
      body += object;
    }
    const start = new TextEncoder().encode(body).length;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index += 1) xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
    return new File([body], "report-q3.pdf", { type: "application/pdf" });
  }, []);
  return (
    <div>
      <Board theme="light" image={image} logo={logo} pdf={pdf} />
      <Board theme="dark" image={image} logo={logo} pdf={pdf} />
    </div>
  );
}
