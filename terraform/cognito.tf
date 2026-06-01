resource "aws_cognito_user_pool" "pool" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "name"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  # Permitir criação de usuários por administradores
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project_name}-${var.environment}-user-pool-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret     = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]
}

resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "/${var.project_name}/cognito_user_pool_id"
  type  = "String"
  value = aws_cognito_user_pool.pool.id
}

resource "aws_ssm_parameter" "cognito_client_id" {
  name  = "/${var.project_name}/cognito_client_id"
  type  = "String"
  value = aws_cognito_user_pool_client.client.id
}

resource "aws_ssm_parameter" "cognito_region" {
  name  = "/${var.project_name}/cognito_region"
  type  = "String"
  value = var.aws_region
}
