import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          const { svg } = await mermaid.render(idRef.current, diagram.content);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
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

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900/50">
      {diagram.title && (
        <CardHeader className="pb-2 border-b border-zinc-800">
          <CardTitle className="text-base font-medium text-zinc-200">{diagram.title}</CardTitle>
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
