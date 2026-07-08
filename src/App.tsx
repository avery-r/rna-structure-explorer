import { useState } from "react";
import {
  predictStructure,
  predict3DStructure,
  type PredictionResult,
  type Prediction3DResult,
} from "./api";
import { StructureDiagram } from "./StructureDiagram";
import { ThermodynamicsPlot } from "./ThermodynamicsPlot";
import { Structure3DView } from "./Structure3DView";
import "./App.css";

function App() {
  const [sequence, setSequence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const [loading3D, setLoading3D] = useState(false);
  const [error3D, setError3D] = useState<string | null>(null);
  const [result3D, setResult3D] = useState<Prediction3DResult | null>(null);

  async function handleExplore() {
    setLoading(true);
    setError(null);
    setResult3D(null);
    setError3D(null);
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

  async function handlePredict3D() {
    if (!result) return;
    setLoading3D(true);
    setError3D(null);
    try {
      const prediction = await predict3DStructure(result.sequence, result.structure);
      setResult3D(prediction);
    } catch (err) {
      setError3D(err instanceof Error ? err.message : "Something went wrong");
      setResult3D(null);
    } finally {
      setLoading3D(false);
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

          <div className="predict-3d">
            <button onClick={handlePredict3D} disabled={loading3D}>
              {loading3D ? "Folding in 3D..." : "Predict 3D structure"}
            </button>
            {loading3D && (
              <p className="hint">
                Coarse-grained 3D folding runs live on Lambda and can take 1-4
                minutes depending on structure complexity. Requires at least 2
                helices.
              </p>
            )}
            {error3D && <p className="error">{error3D}</p>}
            {result3D && <Structure3DView elements={result3D.elements} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
