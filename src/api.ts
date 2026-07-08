import { PREDICT_API_URL } from "./config";

export interface BasePairProbability {
  i: number;
  j: number;
  probability: number;
}

export interface PredictionResult {
  sequence: string;
  structure: string;
  mfe: number;
  ensembleEnergy: number;
  ensembleDiversity: number;
  basePairProbabilities: BasePairProbability[];
}

export async function predictStructure(
  sequence: string,
): Promise<PredictionResult> {
  const response = await fetch(PREDICT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sequence }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Prediction request failed");
  }

  return data as PredictionResult;
}
