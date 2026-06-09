output "ec2_public_ip" {
  description = "IP Público da instância EC2"
  value       = aws_instance.app.public_ip
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.app.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app.arn
}

output "target_group_arn" {
  description = "ARN of the Target Group"
  value       = aws_lb_target_group.app.arn
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "ssh_private_key" {
  description = "Chave SSH privada para acessar a EC2 (salve e mantenha em segurança)"
  value       = tls_private_key.ssh.private_key_pem
  sensitive   = true
}

output "artifacts_bucket_name" {
  description = "Nome do S3 Bucket de Artefatos"
  value       = aws_s3_bucket.artifacts.id
}

output "media_bucket_name" {
  description = "Nome do S3 Bucket de Mídias"
  value       = aws_s3_bucket.media.id
}

output "cloudfront_domain_name" {
  description = "URL do CDN CloudFront para mídias (Atualizar NEXT_PUBLIC_CDN_URL com isso)"
  value       = "https://${aws_cloudfront_distribution.media.domain_name}"
}

output "github_actions_role_arn" {
  description = "ARN da IAM Role para colocar no Github Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "order_queue_url" {
  description = "URL da fila SQS de pedidos"
  value       = aws_sqs_queue.orders.url
}

output "order_queue_arn" {
  description = "ARN da fila SQS de pedidos"
  value       = aws_sqs_queue.orders.arn
}

# =============================================================================
# OUTPUTS DO BANCO DE DADOS POSTGRESQL (EC2 PRIVADO)
# =============================================================================

output "postgres_instance_id" {
  description = "ID da instancia EC2 do PostgreSQL"
  value       = aws_instance.postgres.id
}

output "postgres_private_ip" {
  description = "IP privado da instancia EC2 do PostgreSQL (usar na DATABASE_URL)"
  value       = aws_instance.postgres.private_ip
}

output "postgres_security_group_id" {
  description = "ID do Security Group do PostgreSQL"
  value       = aws_security_group.postgres.id
}

output "postgres_private_subnet_ids" {
  description = "IDs das subnets privadas"
  value       = [aws_subnet.private_az1.id, aws_subnet.private_az2.id]
}

output "postgres_database_url" {
  description = "Connection string completa para o PostgreSQL na EC2 privada"
  value       = "postgresql://postgres:${var.postgres_db_password}@${aws_instance.postgres.private_ip}:5432/${var.postgres_db_name}?schema=public"
  sensitive   = true
}
