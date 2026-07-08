# rna-predict-3d Lambda

Coarse-grained 3D structure prediction using [ernwin](https://github.com/ViennaRNA/ernwin) (MCMC sampling over helix/loop cylinders). Runs as a container-image Lambda since ernwin's dependency stack (numpy/scipy/pandas/scikit-learn/matplotlib) is too large for the zip/layer packaging limit (250MB unzipped).

Invoked via a **Lambda Function URL**, not API Gateway — predictions take 1-4 minutes depending on structure complexity, which exceeds API Gateway's 30s hard timeout cap.

## Redeploy after changing `handler.py`

```
cd lambda/rna-predict-3d
docker build --platform linux/amd64 -t rna-predict-3d:dev .
docker tag rna-predict-3d:dev 249042068549.dkr.ecr.us-east-1.amazonaws.com/rna-predict-3d:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 249042068549.dkr.ecr.us-east-1.amazonaws.com
docker push 249042068549.dkr.ecr.us-east-1.amazonaws.com/rna-predict-3d:latest
aws lambda update-function-code --function-name rna-predict-3d \
  --image-uri 249042068549.dkr.ecr.us-east-1.amazonaws.com/rna-predict-3d:latest \
  --region us-east-1
```

## Local testing

Requires Docker (this project uses colima: `colima start --cpu 2 --memory 4`).

```
docker run --rm --platform linux/amd64 -d -p 9000:8080 --name rna3d-test rna-predict-3d:dev
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"requestContext": {"http": {"method": "POST"}}, "body": "{\"sequence\": \"GGGAAACCCGGGAAACCC\", \"structure\": \"(((...)))(((...)))\"}"}'
docker stop rna3d-test
```

Note: needs a structure with >= 2 helices (a single hairpin has nothing to sample).

## Infrastructure

- Function: `rna-predict-3d` (Lambda container image, 2048MB, 840s timeout)
- ECR repo: `249042068549.dkr.ecr.us-east-1.amazonaws.com/rna-predict-3d`
- Function URL (public, CORS enabled): `https://6zkjp7sectbn7bwpxumcgxnf740swsrq.lambda-url.us-east-1.on.aws/`
- Requires two resource-based policy statements for public access: `lambda:InvokeFunctionUrl` AND `lambda:InvokeFunction` (both required since Oct 2025)

## Known limits

- Max sequence length: 100nt
- Max helices: 6 (keeps worst-case runtime bounded; more stems load per-iteration cost)
- Output is coarse-grained (helices as cylinders), not atomic-detail
