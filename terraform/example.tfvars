# Copy to terraform.tfvars (gitignored) and fill in.

environment = "staging"
github_repo = "moacsjr/massasco"

# GitHub PAT with read access to the repo (Amplify uses it to clone and set up the build webhook)
github_access_token = "ghp_YOUR_PERSONAL_ACCESS_TOKEN"

# Leave empty to use only the default *.amplifyapp.com domain
custom_domain = "seudominio.com.br"

# Neon pooled connection string (host contains "-pooler")
database_url = "postgresql://USER:PASSWORD@ep-xxxx-pooler.us-east-1.aws.neon.tech/massasco?sslmode=require"

stripe_secret_key      = "sk_test_..."
stripe_webhook_secret  = "whsec_..."
stripe_publishable_key = "pk_test_..."
