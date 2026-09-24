variable "aws_region" {
  description = "Região da AWS onde os recursos serão criados."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome do projeto, usado como prefixo dos recursos."
  type        = string
  default     = "massasco"
}

variable "environment" {
  description = "Ambiente de implantação (ex: staging, prod)."
  type        = string
  default     = "staging"
}

variable "github_repo" {
  description = "Repositório do GitHub no formato 'usuario/repositorio' conectado ao Amplify."
  type        = string
  default     = "moacsjr/massasco"
}

variable "github_access_token" {
  description = "GitHub PAT usado pelo Amplify para ler o repositório e criar o webhook de build."
  type        = string
  sensitive   = true
}

variable "app_branch" {
  description = "Branch do repositório que o Amplify publica."
  type        = string
  default     = "main"
}

variable "custom_domain" {
  description = "Domínio próprio da aplicação (ex: massasco.com.br). Vazio usa só o domínio padrão do Amplify."
  type        = string
  default     = ""
}

variable "database_url" {
  description = "Connection string do Neon (usar o endpoint com pooling, host '-pooler')."
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_publishable_key" {
  type = string
}
