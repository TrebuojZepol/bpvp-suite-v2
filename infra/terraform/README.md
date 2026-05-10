# Terraform (placeholder)

Infrastructure-as-code for cloud environments will live here.

## TODO

- Remote state backend (e.g. S3 + DynamoDB lock or Terraform Cloud).
- Modules for networking, Kubernetes or VM workloads, secrets, and observability.
- Environment separation (`dev`, `staging`, `prod`) with least-privilege IAM.

Do not commit real secrets; use CI/CD–injected variables and secret managers.
