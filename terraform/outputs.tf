output "ec2_public_ip" {
  description = "IP Público da instância EC2"
  value       = aws_instance.app.public_ip
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
