import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import type { BasePairProbability } from "./api";

interface ThermodynamicsPlotProps {
  basePairProbabilities: BasePairProbability[];
  sequenceLength: number;
}

export function ThermodynamicsPlot({
  basePairProbabilities,
  sequenceLength,
}: ThermodynamicsPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current) return;

    Plotly.newPlot(
      plotRef.current,
      [
        {
          x: basePairProbabilities.map((p) => p.i),
          y: basePairProbabilities.map((p) => p.j),
          mode: "markers",
          type: "scatter",
          marker: {
            size: basePairProbabilities.map((p) => 4 + p.probability * 12),
            color: basePairProbabilities.map((p) => p.probability),
            colorscale: "Viridis",
            showscale: true,
            colorbar: { title: { text: "P(pair)" } },
          },
          text: basePairProbabilities.map(
            (p) => `${p.i}-${p.j}: ${p.probability}`,
          ),
          hoverinfo: "text",
        },
      ],
      {
        title: { text: "Base-pair probability dot plot" },
        xaxis: { title: { text: "Position i" }, range: [1, sequenceLength] },
        yaxis: { title: { text: "Position j" }, range: [1, sequenceLength] },
        width: 500,
        height: 450,
      },
      { displayModeBar: false },
    );
  }, [basePairProbabilities, sequenceLength]);

  return <div ref={plotRef} />;
}
