### Estratégia de Arquitetura (Privada e Sem Custos Ocultos)

* **Comunicação Direta por IP Privado:** A aplicação e o Postgres conversam dentro da rede da AWS. O tráfego não passa pela internet, o que reduz a latência e zera o custo de transferência de dados (Data Transfer Out).
* **Segurança por Grupos de Segurança (SG):** O Security Group do Postgres vai permitir a entrada **apenas** se a origem for o Security Group da Aplicação.
* **Economia Máxima (Zero NAT Gateway / Zero IP Público):** Como o banco está isolado e tem pouco uso, não colocaremos um *NAT Gateway* na rede privada (já que ele custa mais de US$ 30/mês). Para instalar o Postgres na máquina durante o boot, usaremos uma **AMI que já venha com o Postgres pré-instalado** ou faremos o deploy via uma imagem customizada (Packer). Caso precise que a máquina atualize pacotes raramente, você pode ligar um *NAT Instance* (usando um EC2 `t4g.nano` configurado para NAT) que custa uma fração de um NAT Gateway.

---

### Implementação com Terraform

```hcl
# 1. Security Group do Postgres (Super Seguro)
resource "aws_security_group" "postgres_private_sg" {
  name        = "sg-postgres-private-prod"
  description = "Acesso estrito apenas via rede privada da aplicacao"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Permite conexao apenas do Security Group da Aplicacao"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id] # Vinculação direta entre SGs
  }

  # Egresso zerado ou limitado, já que não há internet na subnet privada
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-postgres-private"
  }
}

# 2. Instância EC2 no Backstage (Subnet Privada)
resource "aws_instance" "postgres_private" {
  # Recomendação: Use uma AMI customizada sua que já tenha o Postgres instalado,
  # ou use o Amazon Linux 2023 / Ubuntu se você possuir um VPC Endpoint do S3/ECR para puxar pacotes.
  ami           = var.ami_with_postgres_preinstalled 
  instance_type = "t3.micro" 
  
  # Alocação na Subnet Privada
  subnet_id              = var.private_subnet_id 
  vpc_security_group_ids = [aws_security_group.postgres_private_sg.id]
  
  # Desabilita explicitamente a atribuição de IP público
  associate_public_ip_address = false 

  root_block_device {
    volume_size           = 10 # 10GB gp3 (Suficiente para pouco uso)
    volume_type           = "gp3"
    throughput            = 125
    iops                  = 3000
    encrypted             = true
    delete_on_termination = true
  }

  credit_specification {
    cpu_credits = "standard"
  }

  tags = {
    Name = "ec2-postgres-private"
  }
}

```

---

### 📉 Nova Estimativa de Custo Mensal (Super Econômica)

Retirando a taxa horária de IP público cobrada pela AWS, a sua infraestrutura de banco de dados passa a custar praticamente apenas o uso de hardware puro:

* **Instância EC2 (`t3.micro`):** ~$7.30
* **Armazenamento Volume EBS (`10GB gp3`):** ~$0.80
* **IP Público / NAT Gateway:** **$0.00**
* **Total Estimado:** **~$8.10 / mês**

