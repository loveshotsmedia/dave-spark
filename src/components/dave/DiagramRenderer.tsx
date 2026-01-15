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
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(7)}`);
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
      return;
    }

    // Initialize Mermaid once per component instance.
    if (!mermaidInitRef.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          // Professional light color scheme for better readability
          primaryColor: '#0EA5E9',
          primaryTextColor: '#1F2937',
          primaryBorderColor: '#0284C7',

          secondaryColor: '#8B5CF6',
          secondaryTextColor: '#1F2937',
          secondaryBorderColor: '#7C3AED',

          tertiaryColor: '#10B981',
          tertiaryTextColor: '#1F2937',
          tertiaryBorderColor: '#059669',

          // Node styling - lighter backgrounds for contrast
          nodeBorder: '#374151',
          nodeTextColor: '#1F2937',

          // Line styling - visible on light/dark
          lineColor: '#6B7280',

          // Light background for better visibility
          background: '#FFFFFF',
          mainBkg: '#F3F4F6',

          // Gantt specific
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

          // Font
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 15,
          nodeSpacing: 60,
          rankSpacing: 60,
          diagramPadding: 20,
          useMaxWidth: false,
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 30,
          barGap: 6,
          topPadding: 60,
          leftPadding: 120,
          gridLineStartPadding: 35,
          fontSize: 12,
          sectionFontSize: 14,
          numberSectionStyles: 4,
          useMaxWidth: false,
        },
      });

      mermaidInitRef.current = true;
    }

    const render = async () => {
      try {
        setHasRenderError(false);
        setIsLoaded(false);
        container.innerHTML = '';

        // Validate first to avoid Mermaid's big "Syntax error" SVG output.
        const parseFn = (mermaid as any).parse;
        if (typeof parseFn === 'function') {
          await Promise.resolve(parseFn(source));
        }

        const { svg } = await mermaid.render(idRef.current, source);

        // Mermaid sometimes returns an "error" SVG instead of throwing.
        if (/Syntax error in text|No diagram type detected|UnknownDiagramError/i.test(svg)) {
          throw new Error('Mermaid syntax error');
        }

        container.innerHTML = svg;

        // Trigger animations after render
        setTimeout(() => {
          setIsLoaded(true);

          // Animate nodes sequentially
          const nodes = container.querySelectorAll('.node');
          nodes.forEach((node, index) => {
            setTimeout(() => {
              (node as HTMLElement).classList.add('animate-in');
            }, index * 100);
          });

          // Animate edges after nodes
          const edges = container.querySelectorAll('.edgePath');
          edges.forEach((edge, index) => {
            setTimeout(() => {
              (edge as HTMLElement).classList.add('animate-in');
            }, (nodes.length * 100) + (index * 50));
          });
        }, 100);
      } catch (error) {
        setHasRenderError(true);
        setIsLoaded(false);
        container.innerHTML = '';
        console.warn('Mermaid render error:', error);
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
            className="diagram-container flex justify-center items-center overflow-auto rounded-xl bg-white p-8 min-h-[300px] shadow-inner"
            style={{
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
