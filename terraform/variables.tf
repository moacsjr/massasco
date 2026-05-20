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
