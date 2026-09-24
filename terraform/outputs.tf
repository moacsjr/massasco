output "amplify_app_id" {
  value = aws_amplify_app.app.id
}

output "app_url" {
  description = "URL padrão do Amplify para a branch publicada"
  value       = "https://${var.app_branch}.${aws_amplify_app.app.default_domain}"
}

output "custom_domain_certificate_record" {
  description = "Registro DNS (CNAME) de validação do certificado — criar no provedor do domínio"
  value       = try(aws_amplify_domain_association.main[0].certificate_verification_dns_record, null)
}

output "custom_domain_records" {
  description = "Registros DNS de cada subdomínio — criar no provedor do domínio"
  value       = try([for s in aws_amplify_domain_association.main[0].sub_domain : s.dns_record], [])
}

output "media_bucket_name" {
  value = aws_s3_bucket.media.id
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.media.domain_name}"
}

output "order_queue_url" {
  value = aws_sqs_queue.orders.url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
}
