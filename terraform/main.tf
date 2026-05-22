terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  # Uncomment and configure for secure remote state (required before sharing state).
  # Secrets are stored in plaintext inside terraform.tfstate — a local backend exposes them.
  # backend "s3" {
  #   bucket         = "devxp-portal-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   kms_key_id     = "arn:aws:kms:us-east-1:<account>:key/<key-id>"
  #   dynamodb_table = "terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region
}

provider "github" {
  token = var.github_devxp_pat_token
  owner = var.github_owner
}
