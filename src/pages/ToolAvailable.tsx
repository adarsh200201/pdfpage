import RealTimeToolLoader from "@/components/RealTimeToolLoader";
import { useParams } from "react-router-dom";
import {
  RefreshCw,
  Scissors,
  Archive,
  ArrowUpDown,
  Shield,
  Edit,
  FileText,
  Image,
  Zap,
  Crown,
  Target,
  Activity,
  Sparkles,
  Brain,
} from "lucide-react";

const toolConfigs = {
  "merge-pdf": {
    name: "PDF Merger Pro",
    redirectTo: "/merge",
    description:
      "Combine multiple PDF files into one document with AI-powered optimization and real-time preview capabilities.",
    features: [
      "Intelligent page ordering",
      "Real-time preview mode",
      "Batch processing engine",
      "Smart file optimization",
      "Drag & drop interface",
      "Quality preservation",
    ],
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    icon: RefreshCw,
  },
  "split-pdf": {
    name: "PDF Splitter Pro",
    redirectTo: "/split",
    description:
      "Split PDF files into separate pages or custom ranges with precision control and instant processing.",
    features: [
      "Page range selection",
      "Real-time splitting engine",
      "Instant download ready",
      "Preview before split",
      "Batch splitting mode",
      "Custom naming patterns",
    ],
    color: "purple",
    gradient: "from-purple-500 to-pink-600",
    icon: Scissors,
  },
  "compress-pdf": {
    name: "PDF Compressor Pro",
    redirectTo: "/compress",
    description:
      "Advanced PDF compression with AI-powered size reduction while maintaining document quality and readability.",
    features: [
      "Smart compression algorithms",
      "Quality level control",
      "Size optimization metrics",
      "Batch compression mode",
      "Before/after comparison",
      "Quality preservation",
    ],
    color: "green",
    gradient: "from-green-500 to-emerald-600",
    icon: Archive,
  },
  "convert-pdf": {
    name: "PDF Converter Pro",
    redirectTo: "/convert",
    description:
      "Convert PDFs to multiple formats with real-time processing and advanced conversion options.",
    features: [
      "15+ output formats",
      "Real-time conversion",
      "Quality settings control",
      "Batch conversion mode",
      "Format optimization",
      "Custom conversion rules",
    ],
    color: "orange",
    gradient: "from-orange-500 to-red-600",
    icon: ArrowUpDown,
  },
  "protect-pdf": {
    name: "PDF Protector Pro",
    redirectTo: "/protect-pdf",
    description:
      "Secure your PDFs with advanced encryption, password protection, and permission controls.",
    features: [
      "Military-grade encryption",
      "Password protection",
      "Permission controls",
      "Digital signatures",
      "Security analytics",
      "Bulk protection mode",
    ],
    color: "red",
    gradient: "from-red-500 to-pink-600",
    icon: Shield,
  },
  "edit-pdf": {
    name: "PDF Editor Pro",
    redirectTo: "/edit-pdf",
    description:
      "Professional PDF editing with real-time text editing, image insertion, and annotation tools.",
    features: [
      "Real-time text editing",
      "Image insertion & editing",
      "Advanced annotations",
      "Form field creation",
      "Digital signatures",
      "Collaborative editing",
    ],
    color: "yellow",
    gradient: "from-yellow-500 to-orange-600",
    icon: Edit,
  },
  "watermark-pdf": {
    name: "PDF Watermark Pro",
    redirectTo: "/watermark",
    description:
      "Add professional watermarks to PDFs with real-time preview and advanced customization options.",
    features: [
      "Text & image watermarks",
      "Real-time preview",
      "Position customization",
      "Transparency controls",
      "Batch watermarking",
      "Template library",
    ],
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    icon: Image,
  },
  "rotate-pdf": {
    name: "PDF Rotator Pro",
    redirectTo: "/rotate",
    description:
      "Rotate PDF pages with precision control and real-time preview for perfect document orientation.",
    features: [
      "90°, 180°, 270° rotation",
      "Real-time preview",
      "Page-specific rotation",
      "Batch rotation mode",
      "Undo/redo support",
      "Auto-orientation detection",
    ],
    color: "teal",
    gradient: "from-teal-500 to-cyan-600",
    icon: RefreshCw,
  },
  "crop-pdf": {
    name: "PDF Cropper Pro",
    redirectTo: "/crop-pdf",
    description:
      "Crop PDF pages with precision tools and real-time preview for perfect page dimensions.",
    features: [
      "Precision cropping tools",
      "Real-time preview",
      "Custom crop areas",
      "Batch cropping mode",
      "Aspect ratio controls",
      "Margin adjustments",
    ],
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    icon: Target,
  },
  "organize-pdf": {
    name: "PDF Organizer Pro",
    redirectTo: "/organize-pdf",
    description:
      "Reorganize PDF pages with drag-and-drop interface and real-time page management.",
    features: [
      "Drag & drop interface",
      "Real-time page preview",
      "Page reordering",
      "Duplicate detection",
      "Thumbnail navigation",
      "Batch organization",
    ],
    color: "lime",
    gradient: "from-lime-500 to-green-600",
    icon: Activity,
  },
};

const ToolAvailable = () => {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const config = toolConfigs[toolSlug as keyof typeof toolConfigs];

  if (!config) {
    return (
      <RealTimeToolLoader
        toolName="PDF Tool Pro"
        redirectTo="/merge"
        description="Advanced PDF processing with real-time capabilities"
        features={[
          "Real-time processing",
          "AI optimization",
          "Batch mode",
          "Quality control",
        ]}
        color="blue"
        gradient="from-blue-500 to-indigo-600"
        icon={FileText}
      />
    );
  }

  return (
    <RealTimeToolLoader
      toolName={config.name}
      redirectTo={config.redirectTo}
      description={config.description}
      features={config.features}
      color={config.color}
      gradient={config.gradient}
      icon={config.icon}
    />
  );
};

export default ToolAvailable;
