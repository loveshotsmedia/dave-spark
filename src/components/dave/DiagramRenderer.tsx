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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (diagram.format === 'mermaid' && containerRef.current) {
      // Initialize Mermaid with professional styling
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          // Professional color scheme
          primaryColor: '#0EA5E9',
          primaryTextColor: '#FFFFFF',
          primaryBorderColor: '#0284C7',
          
          secondaryColor: '#8B5CF6',
          secondaryTextColor: '#FFFFFF',
          secondaryBorderColor: '#7C3AED',
          
          tertiaryColor: '#10B981',
          tertiaryTextColor: '#FFFFFF',
          tertiaryBorderColor: '#059669',
          
          // Node styling
          nodeBorder: '#374151',
          nodeTextColor: '#F9FAFB',
          
          // Line styling
          lineColor: '#6B7280',
          
          // Background
          background: '#18181B',
          mainBkg: '#27272A',
          
          // Font
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '14px'
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
          diagramPadding: 30,
          useMaxWidth: true
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 40,
          barGap: 8,
          topPadding: 75,
          gridLineStartPadding: 35,
          fontSize: 12,
          numberSectionStyles: 4,
          useMaxWidth: true
        }
      });

      // Render the diagram
      const render = async () => {
        try {
          setIsLoaded(false);
          const { svg } = await mermaid.render(idRef.current, diagram.content);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            
            // Trigger animations after render
            setTimeout(() => {
              setIsLoaded(true);
              
              // Animate nodes sequentially
              const nodes = containerRef.current?.querySelectorAll('.node');
              nodes?.forEach((node, index) => {
                setTimeout(() => {
                  (node as HTMLElement).classList.add('animate-in');
                }, index * 100);
              });

              // Animate edges after nodes
              const edges = containerRef.current?.querySelectorAll('.edgePath');
              edges?.forEach((edge, index) => {
                setTimeout(() => {
                  (edge as HTMLElement).classList.add('animate-in');
                }, ((nodes?.length || 0) * 100) + (index * 50));
              });
            }, 100);
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = '<p class="text-destructive">Failed to render diagram</p>';
          }
        }
      };

      render();
    }
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
      <CardContent className="pt-4">
        {diagram.format === 'mermaid' && (
          <div 
            ref={containerRef} 
            className="diagram-container flex justify-center overflow-x-auto rounded-lg bg-gradient-to-b from-zinc-900 to-zinc-950 p-6"
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
