import json
import re

import RNA

MAX_LENGTH = 500
VALID_BASES = re.compile(r"^[ACGU]+$")


def _error(status, message):
    return {
        "statusCode": status,
        "body": json.dumps({"error": message}),
    }


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    if method == "OPTIONS":
        return {"statusCode": 200, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _error(400, "Request body must be valid JSON")

    raw_sequence = body.get("sequence", "")
    sequence = raw_sequence.strip().upper().replace("T", "U")

    if not sequence:
        return _error(400, "Field 'sequence' is required")
    if len(sequence) > MAX_LENGTH:
        return _error(400, f"Sequence exceeds max length of {MAX_LENGTH}")
    if not VALID_BASES.match(sequence):
        return _error(400, "Sequence must contain only A, C, G, U (or T)")

    structure, mfe = RNA.fold(sequence)

    fold_compound = RNA.fold_compound(sequence)
    _, ensemble_energy = fold_compound.pf()
    ensemble_diversity = fold_compound.mean_bp_distance()

    base_pair_probabilities = []
    bpp_matrix = fold_compound.bpp()
    for i in range(1, len(sequence) + 1):
        for j in range(i + 1, len(sequence) + 1):
            prob = bpp_matrix[i][j]
            if prob > 0.01:
                base_pair_probabilities.append(
                    {"i": i, "j": j, "probability": round(prob, 4)}
                )

    result = {
        "sequence": sequence,
        "structure": structure,
        "mfe": round(mfe, 2),
        "ensembleEnergy": round(ensemble_energy, 2),
        "ensembleDiversity": round(ensemble_diversity, 2),
        "basePairProbabilities": base_pair_probabilities,
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result),
    }
