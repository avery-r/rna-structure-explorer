import { PREDICT_API_URL, PREDICT_3D_API_URL } from "./config";

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

export interface StructureElement3D {
  name: string;
  type: "stem" | "hairpin" | "multiloop" | "interior" | "dangling" | "other";
  ntRange: number[];
  start: [number, number, number];
  end: [number, number, number];
}

export interface Prediction3DResult {
  sequence: string;
  structure: string;
  elements: StructureElement3D[];
}

export async function predict3DStructure(
  sequence: string,
  structure: string,
): Promise<Prediction3DResult> {
  const response = await fetch(PREDICT_3D_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sequence, structure }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "3D prediction request failed");
  }

  return data as Prediction3DResult;
}
