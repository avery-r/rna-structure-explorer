import { useState } from "react";
import { predictStructure, type PredictionResult } from "./api";
import { StructureDiagram } from "./StructureDiagram";
import { ThermodynamicsPlot } from "./ThermodynamicsPlot";
import "./App.css";

function App() {
  const [sequence, setSequence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  async function handleExplore() {
    setLoading(true);
    setError(null);
    try {
      const prediction = await predictStructure(sequence);
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>RNA Structure Explorer</h1>
      <p>
        Enter an RNA (or DNA) sequence to predict its secondary structure and
        thermodynamic properties.
      </p>

      <textarea
        value={sequence}
        onChange={(e) => setSequence(e.target.value)}
        placeholder="e.g. GGGAAACCC"
        rows={4}
        cols={60}
      />
      <div>
        <button onClick={handleExplore} disabled={loading || !sequence.trim()}>
          {loading ? "Exploring..." : "Explore"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results">
          <div className="stats">
            <div>
              <strong>Structure:</strong> <code>{result.structure}</code>
            </div>
            <div>
              <strong>MFE:</strong> {result.mfe} kcal/mol
            </div>
            <div>
              <strong>Ensemble free energy:</strong> {result.ensembleEnergy}{" "}
              kcal/mol
            </div>
            <div>
              <strong>Ensemble diversity:</strong> {result.ensembleDiversity}
            </div>
          </div>

          <div className="panels">
            <StructureDiagram
              sequence={result.sequence}
              structure={result.structure}
            />
            <ThermodynamicsPlot
              basePairProbabilities={result.basePairProbabilities}
              sequenceLength={result.sequence.length}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
