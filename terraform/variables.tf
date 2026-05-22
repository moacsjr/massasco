variable "aws_region" {
  description = "A região da AWS onde os recursos serão criados."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "O nome do projeto, usado para prefixar os nomes dos recursos."
  type        = string
  default     = "devxp-portal"
}

variable "environment" {
  description = "O ambiente de implantação (ex: dev, prod)."
  type        = string
  default     = "prod"
}

variable "github_repo" {
  description = "Repositório do GitHub no formato 'usuario/repositorio' para permissões OIDC."
  type        = string
  default     = "moacsjr/massasco"
}

variable "github_devxp_pat_token" {
  description = "GitHub Personal Access Token (PAT) com permissões para gerenciar Secrets e Variables"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "Usuário ou Organização dona do repositório no GitHub"
  type        = string
  default     = "moacsjr"
}

variable "github_environment" {
  description = "Nome do ambiente do GitHub para Secrets/Variables com escopo (ex: staging, production)"
  type        = string
  default     = "staging"
}

variable "database_url" {
  description = "Connection string used at runtime. Staging defaults to the docker-compose Postgres on the same EC2; override (via tfvars) when migrating to RDS."
  type        = string
  sensitive   = true
  default     = "postgresql://postgres:password@localhost:5432/devxp?schema=public"
}
