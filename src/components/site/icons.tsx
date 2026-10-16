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
} from "lucide-react";

export function ToolIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const props = { className, "aria-hidden": true as const };
  switch (name) {
    case "Bot":
      return <Bot {...props} />;
    case "Box":
      return <Box {...props} />;
    case "Braces":
      return <Braces {...props} />;
    case "Clock":
      return <Clock {...props} />;
    case "Coins":
      return <Coins {...props} />;
    case "Container":
      return <Container {...props} />;
    case "FileText":
      return <FileText {...props} />;
    case "Image":
      return <ImageIcon {...props} />;
    case "KeyRound":
      return <KeyRound {...props} />;
    case "Search":
      return <Search {...props} />;
    case "Share2":
      return <Share2 {...props} />;
    case "Shield":
      return <Shield {...props} />;
    case "Sparkles":
      return <Sparkles {...props} />;
    case "Tags":
      return <Tags {...props} />;
    case "Terminal":
      return <Terminal {...props} />;
    default:
      return <FileText {...props} />;
  }
}
