resource "aws_amplify_app" "app" {
  name             = var.project_name
  repository       = "https://github.com/${var.github_repo}"
  access_token     = var.github_access_token
  platform         = "WEB_COMPUTE"
  compute_role_arn = aws_iam_role.amplify_compute.arn

  # Monorepo: amplify.yml at the repo root declares appRoot = apps/app.
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT          = "apps/app"
    DATABASE_URL                       = var.database_url
    STRIPE_SECRET_KEY                  = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET              = var.stripe_webhook_secret
    STRIPE_PUBLISHABLE_KEY             = var.stripe_publishable_key
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = var.stripe_publishable_key
    COGNITO_USER_POOL_ID               = aws_cognito_user_pool.pool.id
    COGNITO_CLIENT_ID                  = aws_cognito_user_pool_client.client.id
    COGNITO_REGION                     = var.aws_region
    SQS_QUEUE_URL                      = aws_sqs_queue.orders.url
    S3_MEDIA_BUCKET_NAME               = aws_s3_bucket.media.id
    NEXT_PUBLIC_CDN_URL                = "https://${aws_cloudfront_distribution.media.domain_name}"
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.app.id
  branch_name       = var.app_branch
  framework         = "Next.js - SSR"
  stage             = var.environment == "prod" ? "PRODUCTION" : "BETA"
  enable_auto_build = true

  # Lives on the branch (not the app) to avoid a cycle with the app's default domain.
  environment_variables = {
    NEXT_PUBLIC_APP_URL = (
      var.custom_domain != ""
      ? "https://${var.custom_domain}"
      : "https://${var.app_branch}.${aws_amplify_app.app.default_domain}"
    )
  }
}

resource "aws_amplify_domain_association" "main" {
  count = var.custom_domain != "" ? 1 : 0

  app_id      = aws_amplify_app.app.id
  domain_name = var.custom_domain

  # DNS may live outside Route53; the verification records are exposed as outputs.
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}
