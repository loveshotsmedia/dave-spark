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
      // Initialize Mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
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
    <Card className="overflow-hidden">
      {diagram.title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{diagram.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-4">
        {diagram.format === 'mermaid' && (
          <div 
            ref={containerRef} 
            className="flex justify-center overflow-x-auto"
          />
        )}

        {diagram.format === 'html' && (
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: diagram.content }}
          />
        )}

        {diagram.format === 'chartjs' && (
          <div className="space-y-2">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {diagram.content}
            </pre>
            <p className="text-xs text-muted-foreground">
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
