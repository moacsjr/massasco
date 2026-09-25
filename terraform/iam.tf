# Service role Amplify uses to write SSR logs to CloudWatch.
resource "aws_iam_role" "amplify_service" {
  name = "${var.project_name}-amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "amplify.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_service_logs" {
  name = "${var.project_name}-amplify-ssr-logs"
  role = aws_iam_role.amplify_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "logs:CreateLogGroup"
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/amplify/*"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/amplify/*:log-stream:*"
      },
      {
        # DescribeLogGroups cannot be scoped to a prefix; Amplify skips logging if it is denied.
        Effect   = "Allow"
        Action   = "logs:DescribeLogGroups"
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:*"
      }
    ]
  })
}

# Role assumed by the Amplify SSR compute (Next.js server/route handlers).
resource "aws_iam_role" "amplify_compute" {
  name = "${var.project_name}-amplify-compute-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "amplify.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_compute" {
  name = "${var.project_name}-amplify-compute-access"
  role = aws_iam_role.amplify_compute.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminSetUserPassword"
        ]
        Resource = aws_cognito_user_pool.pool.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:GetQueueUrl"]
        Resource = aws_sqs_queue.orders.arn
      }
    ]
  })
}
