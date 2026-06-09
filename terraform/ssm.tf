resource "aws_ssm_parameter" "cloudfront_url" {
  name  = "/${var.project_name}/cloudfront_url"
  type  = "String"
  value = "https://${aws_cloudfront_distribution.media.domain_name}"
}

resource "aws_ssm_parameter" "media_bucket" {
  name  = "/${var.project_name}/media_bucket_name"
  type  = "String"
  value = aws_s3_bucket.media.id
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/database_url"
  type  = "SecureString"
  value = var.database_url
}

resource "aws_ssm_parameter" "order_queue_url" {
  name      = "/${var.project_name}/order_queue_url"
  type      = "String"
  value     = aws_sqs_queue.orders.url
  overwrite = true
}

resource "aws_ssm_parameter" "artifacts_bucket" {
  name      = "/${var.project_name}/artifacts_bucket_name"
  type      = "String"
  value     = aws_s3_bucket.artifacts.id
  overwrite = true
}

# =============================================================================
# PARAMETRO SSM PARA O POSTGRESQL NA EC2 PRIVADA
# =============================================================================

resource "aws_ssm_parameter" "postgres_private_ip" {
  name        = "/${var.project_name}/postgres_private_ip"
  description = "IP privado da instancia EC2 do PostgreSQL"
  type        = "String"
  value       = aws_instance.postgres.private_ip
  overwrite   = true
}

resource "aws_ssm_parameter" "postgres_database_url" {
  name        = "/${var.project_name}/postgres_database_url"
  description = "Connection string do PostgreSQL na EC2 privada (usar quando migrar do docker-compose)"
  type        = "SecureString"
  value       = "postgresql://postgres:${var.postgres_db_password}@${aws_instance.postgres.private_ip}:5432/${var.postgres_db_name}?schema=public"
  overwrite   = true
}
