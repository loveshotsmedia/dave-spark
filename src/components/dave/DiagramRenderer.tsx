import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Diagram {
  type: string;
  format: 'mermaid' | 'html' | 'chartjs' | 'svg';
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

interface DiagramRendererProps {
  diagram: Diagram;
}

export function DiagramRenderer({ diagram }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidInitRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  useEffect(() => {
    if (diagram.format !== 'mermaid') return;

    const container = containerRef.current;
    const source = (diagram.content ?? '').trim();

    // Nothing to render => clear any previous SVG and bail.
    if (!container || !source) {
      if (container) container.innerHTML = '';
      setHasRenderError(true);
      return;
    }

    // Basic syntax validation - reject obviously invalid content
    const lowerSource = source.toLowerCase();
    const hasValidDiagramType = /^(graph|flowchart|sequencediagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|sankey|xychart)/i.test(source.trim());
    
    if (!hasValidDiagramType) {
      setHasRenderError(true);
      container.innerHTML = '';
      return;
    }

    // Initialize Mermaid once per component instance.
    if (!mermaidInitRef.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        suppressErrorRendering: true,
        logLevel: 'fatal',
        themeVariables: {
          primaryColor: '#0EA5E9',
          primaryTextColor: '#FFFFFF',
          primaryBorderColor: '#0284C7',
          secondaryColor: '#8B5CF6',
          secondaryTextColor: '#FFFFFF',
          secondaryBorderColor: '#7C3AED',
          tertiaryColor: '#10B981',
          tertiaryTextColor: '#FFFFFF',
          tertiaryBorderColor: '#059669',
          nodeBorder: '#E5E7EB',
          nodeTextColor: '#1F2937',
          lineColor: '#6B7280',
          background: '#FFFFFF',
          mainBkg: '#F9FAFB',
          sectionBkgColor: '#F3F4F6',
          sectionBkgColor2: '#E5E7EB',
          altSectionBkgColor: '#FFFFFF',
          gridColor: '#D1D5DB',
          todayLineColor: '#EF4444',
          taskBkgColor: '#0EA5E9',
          taskTextColor: '#FFFFFF',
          taskTextOutsideColor: '#1F2937',
          activeTaskBkgColor: '#3B82F6',
          activeTaskBorderColor: '#2563EB',
          doneTaskBkgColor: '#10B981',
          doneTaskBorderColor: '#059669',
          critBkgColor: '#EF4444',
          critBorderColor: '#DC2626',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '14px',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
          diagramPadding: 30,
          useMaxWidth: true,
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 40,
          barGap: 8,
          topPadding: 75,
          leftPadding: 120,
          gridLineStartPadding: 35,
          fontSize: 12,
          sectionFontSize: 14,
          numberSectionStyles: 4,
          useMaxWidth: true,
        },
      });

      mermaidInitRef.current = true;
    }

    const render = async () => {
      try {
        setHasRenderError(false);
        setIsLoaded(false);
        container.innerHTML = '';

        // Use a unique ID for each render to avoid conflicts
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const { svg } = await mermaid.render(uniqueId, source);

        // Check for error indicators in the SVG
        if (!svg || 
            svg.includes('Syntax error') || 
            svg.includes('Error') ||
            svg.includes('Parse error') ||
            svg.includes('mermaid version') ||
            svg.includes('UnknownDiagramError')) {
          throw new Error('Mermaid render error');
        }

        container.innerHTML = svg;

        setTimeout(() => {
          setIsLoaded(true);
          const nodes = container.querySelectorAll('.node');
          nodes.forEach((node, index) => {
            setTimeout(() => {
              (node as HTMLElement).classList.add('animate-in');
            }, index * 100);
          });
          const edges = container.querySelectorAll('.edgePath');
          edges.forEach((edge, index) => {
            setTimeout(() => {
              (edge as HTMLElement).classList.add('animate-in');
            }, (nodes.length * 100) + (index * 50));
          });
        }, 100);
      } catch {
        setHasRenderError(true);
        setIsLoaded(false);
        container.innerHTML = '';
      }
    };

    render();
  }, [diagram.content, diagram.format]);

  const handleDownloadSVG = () => {
    if (!containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagram.title || 'diagram'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Diagram saved as SVG",
    });
  };

  const handleOpenFullscreen = () => {
    if (!containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    window.open(url, '_blank');
  };

  // Don't render card at all if there's nothing valid
  if (diagram.format === 'mermaid' && hasRenderError) {
    return null;
  }

  // Don't render if content is empty/undefined
  if (diagram.format === 'mermaid' && !(diagram.content ?? '').trim()) {
    return null;
  }

  return (
    <Card className={`overflow-hidden border-zinc-800 bg-zinc-900/50 transition-all duration-500 ${isLoaded ? 'diagram-loaded' : 'diagram-loading'}`}>
      {diagram.title && (
        <CardHeader className="pb-2 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-zinc-200">{diagram.title}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadSVG}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenFullscreen}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-4 pb-6">
        {diagram.format === 'mermaid' && (
          <div 
            ref={containerRef} 
            className="diagram-container flex justify-center items-center overflow-x-auto overflow-y-hidden rounded-xl p-8 min-h-[350px]"
            style={{
              background: 'linear-gradient(to bottom, #F9FAFB, #FFFFFF)',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
              maxWidth: '100%',
            }}
          />
        )}

        {diagram.format === 'html' && (
          <div 
            className="prose prose-sm max-w-none prose-invert"
            dangerouslySetInnerHTML={{ __html: diagram.content }}
          />
        )}

        {diagram.format === 'chartjs' && (
          <div className="space-y-2">
            <pre className="bg-zinc-800 p-4 rounded-lg text-xs overflow-x-auto text-zinc-300">
              {diagram.content}
            </pre>
            <p className="text-xs text-zinc-500">
              Chart.js data - integrate with a charting library for visualization
            </p>
          </div>
        )}

        {diagram.format === 'svg' && (
          <div 
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: diagram.content }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export type { Diagram };
