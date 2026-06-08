# --- GitHub Repository Reference ---
data "github_repository" "app_repo" {
  full_name = var.github_repo
}

# --- Environment Secrets (scoped to var.github_environment) ---

resource "github_actions_environment_secret" "ec2_host" {
  environment = var.github_environment
  repository  = data.github_repository.app_repo.name
  secret_name = "EC2_HOST"
  value       = aws_instance.app.public_ip
}

resource "github_actions_environment_secret" "ec2_ssh_key" {
  environment = var.github_environment
  repository  = data.github_repository.app_repo.name
  secret_name = "EC2_SSH_KEY"
  value       = tls_private_key.ssh.private_key_pem
}

# --- Environment Variables (scoped to var.github_environment) ---

data "aws_caller_identity" "current" {}

resource "github_actions_environment_variable" "aws_account_id" {
  environment   = var.github_environment
  repository    = data.github_repository.app_repo.name
  variable_name = "AWS_ACCOUNT_ID"
  value         = data.aws_caller_identity.current.account_id
}

data "aws_region" "current" {}

resource "github_actions_environment_variable" "aws_region" {
  environment   = var.github_environment
  repository    = data.github_repository.app_repo.name
  variable_name = "AWS_REGION"
  value         = data.aws_region.current.name
}

resource "github_actions_environment_variable" "aws_role_arn" {
  environment   = var.github_environment
  repository    = data.github_repository.app_repo.name
  variable_name = "AWS_ROLE_ARN"
  value         = aws_iam_role.github_actions.arn
}

resource "github_actions_environment_variable" "sqs_queue_url" {
  environment   = var.github_environment
  repository    = data.github_repository.app_repo.name
  variable_name = "SQS_QUEUE_URL"
  value         = aws_ssm_parameter.order_queue_url.value
}
