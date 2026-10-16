import {
  Bot,
  Box,
  Braces,
  Clock,
  Coins,
  Container,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Search,
  Share2,
  Shield,
  Sparkles,
  Tags,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export const ICONS = {
  Bot,
  Box,
  Braces,
  Clock,
  Coins,
  Container,
  FileText,
  Image: ImageIcon,
  KeyRound,
  Search,
  Share2,
  Shield,
  Sparkles,
  Tags,
  Terminal,
} as const satisfies Record<string, LucideIcon>;

export const ICON_NAMES = Object.keys(ICONS);

export function iconFor(name: string): LucideIcon {
  return ICONS[name as keyof typeof ICONS] ?? FileText;
}
