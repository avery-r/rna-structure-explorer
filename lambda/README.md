# rna-predict Lambda

Predicts RNA secondary structure and thermodynamics using [ViennaRNA](https://www.tbi.univie.ac.at/RNA/).

- `rna-predict/handler.py` — function code
- `layer/` — Lambda layer containing the ViennaRNA Python package (built for `python3.12` / `manylinux2014_x86_64`)

## Redeploy after changing `handler.py`

```
cd lambda/rna-predict
zip -q ../function.zip handler.py
aws lambda update-function-code \
  --function-name rna-predict \
  --zip-file fileb://../function.zip \
  --region us-east-1
```

## Rebuild the ViennaRNA layer (only needed if upgrading ViennaRNA)

```
cd lambda/layer
rm -rf python
python3 -m pip install ViennaRNA \
  --platform manylinux2014_x86_64 --python-version 3.12 \
  --implementation cp --abi cp312 --only-binary=:all: \
  --target ./python
zip -r -q ../layer.zip python
aws lambda publish-layer-version \
  --layer-name viennarna \
  --zip-file fileb://../layer.zip \
  --compatible-runtimes python3.12 \
  --compatible-architectures x86_64 \
  --region us-east-1
```

Then update the function to reference the new layer version ARN.

## Infrastructure

- Function: `rna-predict` (Lambda, Python 3.12, 512MB, 30s timeout)
- API: HTTP API `rna-predict-api` (id `bsfwfooh26`) — `$default` route, `AWS_PROXY` integration, CORS enabled for all origins
- Endpoint: `https://bsfwfooh26.execute-api.us-east-1.amazonaws.com/`
