data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# AMI do Ubuntu Server 22.04 LTS para o PostgreSQL
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ec2_key" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.ssh.public_key_openssh
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${var.project_name}-tg"
    Environment = var.environment
  }
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = {
    Name = "${var.project_name}-http-listener"
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.small"
  key_name      = aws_key_pair.ec2_key.key_name

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 100
      volume_type = "gp3"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    dnf update -y

    # Install Docker
    dnf install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose plugin
    DOCKER_CONFIG=/usr/local/lib/docker
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
    # Also add as standalone for compatibility
    curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/

    # Create app directory
    mkdir -p /home/ec2-user/meu-app
    chown -R ec2-user:ec2-user /home/ec2-user/meu-app
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-ec2"
      Environment = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-lt"
    Environment = var.environment
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-asg"
  desired_capacity    = 1
  max_size            = 2
  min_size            = 1
  target_group_arns   = [aws_lb_target_group.app.arn]
  vpc_zone_identifier = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Keep the original EC2 instance for backward compatibility during migration
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.small"

  subnet_id                   = aws_subnet.public_az1.id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  key_name                    = aws_key_pair.ec2_key.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 100
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    dnf update -y

    # Install Docker
    dnf install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose plugin
    DOCKER_CONFIG=/usr/local/lib/docker
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
    # Also add as standalone for compatibility
    curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/

    # Create app directory
    mkdir -p /home/ec2-user/meu-app
    chown -R ec2-user:ec2-user /home/ec2-user/meu-app
  EOF

  tags = {
    Name        = "${var.project_name}-ec2"
    Environment = var.environment
  }
}

# =============================================================================
# INSTANCIA EC2 DO POSTGRESQL (SUBNET PRIVADA - SEM IP PUBLICO)
# =============================================================================

resource "aws_instance" "postgres" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  # Alocacao na Subnet Privada
  subnet_id              = aws_subnet.private_az1.id
  vpc_security_group_ids = [aws_security_group.postgres.id]
  key_name               = aws_key_pair.ec2_key.key_name

  # Instance profile para acesso via SSM Session Manager
  iam_instance_profile = aws_iam_instance_profile.postgres.name

  # Desabilita explicitamente a atribuicao de IP publico
  associate_public_ip_address = false

  # Volume root para o sistema operacional
  root_block_device {
    volume_size           = 10
    volume_type           = "gp3"
    throughput            = 125
    iops                  = 3000
    encrypted             = true
    delete_on_termination = true
  }

  credit_specification {
    cpu_credits = "standard"
  }

  # Script de instalacao e configuracao do PostgreSQL
  user_data = base64encode(<<-USERDATA
    #!/bin/bash
    set -e

    # 0. Instalar SSM Agent para acesso remoto
    snap install amazon-ssm-agent --classic || true
    systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
    systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

    # 1. Atualizar pacotes e instalar Postgres 16
    apt-get update -y
    apt-get install -y gnupg wget curl
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
    sed -i 's|apt-key add -|gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg|' /dev/null 2>&1 || true
    apt-get update -y
    apt-get install -y postgresql-16 postgresql-contrib-16

    # Parar o servico para configuracao
    systemctl stop postgresql

    # 2. Configurar pg_hba.conf para permitir conexoes da rede privada
    cat >> /etc/postgresql/16/main/pg_hba.conf <<PGEOF
    # Permitir conexoes da VPC privada
    host    all    all    10.0.0.0/16    scram-sha-256
    PGEOF

    # 3. Configurar postgresql.conf
    sed -i "s|#listen_addresses = 'localhost'|listen_addresses = '*'|g" /etc/postgresql/16/main/postgresql.conf

    # 4. Definir senha do usuario postgres
    systemctl start postgresql
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${var.postgres_db_password}';"
    sudo -u postgres psql -c "CREATE DATABASE ${var.postgres_db_name};"
    systemctl stop postgresql

    # 5. Reiniciar o servico
    systemctl start postgresql
    systemctl enable postgresql

    echo "PostgreSQL installation completed successfully"
  USERDATA
  )

  tags = {
    Name        = "${var.project_name}-postgres"
    Environment = var.environment
  }
}
