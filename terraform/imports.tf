import {
  to = aws_key_pair.ec2_key
  id = "devxp-portal-key"
}

import {
  to = aws_ecr_repository.app
  id = "devxp-app"
}

import {
  to = aws_iam_role.ec2
  id = "devxp-portal-ec2-role"
}

import {
  to = aws_iam_policy.ec2_s3_access
  id = "arn:aws:iam::458889634344:policy/devxp-portal-ec2-s3-access"
}

import {
  to = aws_iam_policy.ec2_ecr_access
  id = "arn:aws:iam::458889634344:policy/devxp-portal-ec2-ecr-access"
}

import {
  to = aws_iam_role_policy_attachment.ec2_ssm
  id = "devxp-portal-ec2-role/arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

import {
  to = aws_iam_role_policy_attachment.ec2_s3
  id = "devxp-portal-ec2-role/arn:aws:iam::458889634344:policy/devxp-portal-ec2-s3-access"
}

import {
  to = aws_iam_role_policy_attachment.ec2_ecr
  id = "devxp-portal-ec2-role/arn:aws:iam::458889634344:policy/devxp-portal-ec2-ecr-access"
}

import {
  to = aws_iam_instance_profile.ec2
  id = "devxp-portal-ec2-profile"
}

import {
  to = aws_iam_openid_connect_provider.github
  id = "arn:aws:iam::458889634344:oidc-provider/token.actions.githubusercontent.com"
}

import {
  to = aws_iam_role.github_actions
  id = "devxp-portal-github-actions-role"
}

import {
  to = aws_iam_policy.github_actions_deploy
  id = "arn:aws:iam::458889634344:policy/devxp-portal-github-actions-deploy-policy"
}

import {
  to = aws_iam_role_policy_attachment.github_actions_deploy
  id = "devxp-portal-github-actions-role/arn:aws:iam::458889634344:policy/devxp-portal-github-actions-deploy-policy"
}

import {
  to = github_actions_environment_variable.aws_account_id
  id = "massasco:staging:AWS_ACCOUNT_ID"
}

import {
  to = github_actions_environment_variable.aws_region
  id = "massasco:staging:AWS_REGION"
}

import {
  to = github_actions_environment_variable.aws_role_arn
  id = "massasco:staging:AWS_ROLE_ARN"
}

import {
  to = github_actions_environment_secret.ec2_host
  id = "massasco:staging:EC2_HOST"
}

import {
  to = aws_ssm_parameter.media_bucket
  id = "/devxp-portal/media_bucket_name"
}

import {
  to = aws_ssm_parameter.database_url
  id = "/devxp-portal/database_url"
}

import {
  to = aws_ssm_parameter.cloudfront_url
  id = "/devxp-portal/cloudfront_url"
}

import {
  to = aws_cloudfront_origin_access_control.media
  id = "E4AV1WYK2VBDV"
}

import {
  to = aws_cloudfront_distribution.media
  id = "E1NW8TUXP04NQ0"
}

