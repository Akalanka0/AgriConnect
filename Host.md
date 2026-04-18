# 🌍 Complete Hosting & CI/CD Guide

Welcome! If you want to host this project on your own cloud server (like an Azure Virtual Machine) and set up automatic deployments (CI/CD), follow this simple step-by-step guide. 

We use **Docker** to make running the Frontend, Backend, and Database super easy.

---

## 🚀 Part 1: Manual Server Setup

### 1️⃣ Create a Virtual Machine (VM)
Create a VM on Azure, AWS, or any cloud provider:
* **OS:** Ubuntu 24.04 LTS
* **Size:** Minimum 2 vCPU, 8GB RAM (e.g., Azure `B2as_v2`)
* **Network / Security:** You MUST open the following ports:
  * **Port 22 (SSH):** So you can connect to the server.
  * **Port 80 (HTTP):** So the public can view the website.
* **Authentication:** Use an SSH Key (download the `.pem` file).

### 2️⃣ Connect to Your VM
Open your computer's terminal, locate your `.pem` key, and run:
*(Windows users may need to fix file permissions for the key first)*
```bash
ssh -i your-key.pem your-username@your-server-ip
```

### 3️⃣ Install Docker & Git
Once inside your VM, prepare the environment:
```bash
sudo apt update
sudo apt install docker.io docker-compose git -y
sudo systemctl enable docker
```

### 4️⃣ Clone the Project
```bash
git clone https://github.com/YOUR_USERNAME/AgriConnect.git
cd AgriConnect
```

### 5️⃣ Set Up Environment Variables (.env)
We **do not** upload passwords to GitHub. You must manually create the `.env` file on the server.
```bash
nano .env
```
Paste your database/config variables:
```env
DB_HOST=db
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=agriconnect
PORT=5000
```
Save and exit (`CTRL+X`, `Y`, `Enter`).

### 6️⃣ Run the Project!
Start all the containers (Frontend, Backend, MySQL) in the background:
```bash
sudo docker-compose up --build -d
```
🎉 **Open your browser and go to `http://your-server-ip`. Your website is now LIVE!**

---

## 🤖 Part 2: CI/CD Automation Setup

Instead of logging into the server to pull new code every time, this project includes a GitHub Action (`.github/workflows/ci-cd.yml`) that automates it. 

### How it works:
1. You push code to the `main` branch.
2. GitHub runs the automated tests.
3. If tests pass, GitHub logs into your VM securely via SSH.
4. It pulls the latest code, stops Docker, rebuilds it, and turns the website back on.

### 🔑 Set Up GitHub Secrets
To make this work, GitHub needs permission to access your VM. Go to your repository on GitHub:
**Settings > Secrets and variables > Actions > New repository secret**

Add these 3 secrets:

| Secret Name | Description | Example |
| --- | --- | --- |
| `VM_HOST` | Your server's public IP address | `20.xxx.xxx.xxx` |
| `VM_USERNAME` | The login name for the server | `azureuser` or `ubuntu` |
| `VM_SSH_KEY` | The raw text of your `.pem` file | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

Once those secrets are saved, your CI/CD pipeline is fully armed. Any push to `main` will automatically deploy your code!