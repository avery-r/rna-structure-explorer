import { useEffect, useRef } from "react";

interface StructureDiagramProps {
  sequence: string;
  structure: string;
}

export function StructureDiagram({ sequence, structure }: StructureDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !window.fornac) return;
    containerRef.current.innerHTML = "";

    const container = new window.fornac.FornaContainer(containerRef.current, {
      applyForce: true,
      allowPanningAndZooming: true,
      initialSize: [500, 400],
    });
    container.addRNA(structure, { sequence, structure });
    container.setSize();
  }, [sequence, structure]);

  return <div ref={containerRef} style={{ width: 500, height: 400 }} />;
}
