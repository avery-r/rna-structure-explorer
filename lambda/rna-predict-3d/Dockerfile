FROM public.ecr.aws/lambda/python:3.12

RUN pip install --no-cache-dir "numpy<2" ernwin forgi

COPY handler.py ${LAMBDA_TASK_ROOT}/

CMD ["handler.handler"]
