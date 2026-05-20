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
