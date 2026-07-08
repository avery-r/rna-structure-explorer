import glob
import json
import re
import subprocess
import uuid

MAX_LENGTH = 100
MAX_STEMS = 6
ITERATIONS = 500
VALID_BASES = re.compile(r"^[ACGU]+$")


def _response(status, payload):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _parse_coord_file(path):
    elements = {}
    with open(path) as f:
        for line in f:
            parts = line.split()
            if not parts:
                continue
            if parts[0] == "define":
                name = parts[1]
                nt_range = [int(x) for x in parts[2:]]
                elements.setdefault(name, {})["ntRange"] = nt_range
            elif parts[0] == "coord":
                name = parts[1]
                coords = [float(x) for x in parts[2:8]]
                elements.setdefault(name, {})["start"] = coords[0:3]
                elements.setdefault(name, {})["end"] = coords[3:6]

    result = []
    for name, data in elements.items():
        if "start" not in data:
            continue
        result.append(
            {
                "name": name,
                "type": {"s": "stem", "h": "hairpin", "m": "multiloop", "i": "interior", "t": "dangling"}.get(
                    name[0], "other"
                ),
                "ntRange": data.get("ntRange", []),
                "start": data["start"],
                "end": data["end"],
            }
        )
    return result


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    if method == "OPTIONS":
        return {"statusCode": 200, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"error": "Request body must be valid JSON"})

    sequence = body.get("sequence", "").strip().upper().replace("T", "U")
    structure = body.get("structure", "").strip()

    if not sequence or not structure:
        return _response(400, {"error": "Fields 'sequence' and 'structure' are required"})
    if len(sequence) != len(structure):
        return _response(400, {"error": "Sequence and structure must be the same length"})
    if len(sequence) > MAX_LENGTH:
        return _response(400, {"error": f"Sequence exceeds max length of {MAX_LENGTH} for 3D prediction"})
    if not VALID_BASES.match(sequence):
        return _response(400, {"error": "Sequence must contain only A, C, G, U (or T)"})

    stem_count = len(re.findall(r"\(+", structure))
    if stem_count > MAX_STEMS:
        return _response(
            400,
            {
                "error": (
                    f"Structure has {stem_count} helices, which exceeds the max of "
                    f"{MAX_STEMS} supported for 3D prediction (keeps runtime bounded)"
                )
            },
        )

    run_id = uuid.uuid4().hex
    input_path = f"/tmp/{run_id}.fa"
    output_dir = f"/tmp/out-{run_id}"

    with open(input_path, "w") as f:
        f.write(f">{run_id}\n{sequence}\n{structure}\n")

    try:
        result = subprocess.run(
            [
                "ernwin.py",
                input_path,
                "-i",
                str(ITERATIONS),
                "--output-base-dir",
                output_dir,
                "-q",
            ],
            capture_output=True,
            text=True,
            timeout=780,
        )
    except subprocess.TimeoutExpired:
        return _response(504, {"error": "3D prediction timed out for this structure"})

    coord_files = glob.glob(f"{output_dir}/**/best0.coord", recursive=True)
    if not coord_files:
        error_detail = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "Unknown error"
        if "fewer than 2 stems" in result.stderr:
            error_detail = (
                "3D prediction requires a structure with at least 2 helices "
                "(this sequence folds into a single hairpin)"
            )
        return _response(422, {"error": f"3D prediction failed: {error_detail}"})

    elements = _parse_coord_file(coord_files[0])

    return _response(
        200,
        {
            "sequence": sequence,
            "structure": structure,
            "elements": elements,
        },
    )
