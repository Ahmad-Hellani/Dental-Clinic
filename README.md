# Smile Clinic - Dental Appointment System

IN401 Lab 2 - Microservices. A cloud-native dental clinic appointment system split into
independent microservices, containerized with Docker and orchestrated with Docker Compose.

## Architecture

```
Browser --> proxy (nginx :8080)
              |-- /api/auth/*  --> authentication (:4001) --> auth-db   (Postgres 17)
              |-- /api/*       --> backend        (:4002) --> clinic-db (Postgres 17)
              |                         |
              |                         '--> calls authentication /api/auth/verify (internal network)
              '-- /*           --> frontend       (nginx, static React build)
```

| Service          | Tech                                   | Responsibility                                          |
|------------------|----------------------------------------|---------------------------------------------------------|
| `proxy`          | nginx:alpine                           | Single public entry point, routes by URL path           |
| `frontend`       | React, TypeScript, Vite, Tailwind      | UI (atomic design), served as static files by nginx     |
| `authentication` | Node 20, Express, TypeScript, pg, JWT  | Register, login, refresh tokens, users and roles        |
| `backend`        | Node 20, Express, TypeScript, pg       | Treatments, dentists, slots, appointments, admin stats  |
| `auth-db`        | postgres:17-alpine                     | Owned only by `authentication`                          |
| `clinic-db`      | postgres:17-alpine                     | Owned only by `backend`                                 |

Key rules:
- `backend` never touches `auth-db`. It validates every token by calling `authentication`.
- No cross-database foreign keys. Users are referenced by UUID only.
- Only the proxy publishes a port to the host. Databases and services are internal.
- Migrations and demo data run automatically on container start. No manual steps.

Note: the frontend's API layer lives in `frontend/src/services/` (the spec's `features/` role).

## Demo accounts (seeded automatically)

Password for all: `Password123!`

| Role    | Email                       |
|---------|-----------------------------|
| Admin   | admin@dentalclinic.com      |
| Dentist | dr.sara@dentalclinic.com    |
| Dentist | dr.karim@dentalclinic.com   |
| Patient | patient@dentalclinic.com    |

The login page has one-click "Quick demo login" buttons.

## 1. Run locally (Windows, Docker Desktop)

```bash
cp .env.example .env        # then edit the passwords and secrets
docker compose up --build
```

Open http://localhost:8080

Stop: `Ctrl+C`, then `docker compose down`.
Stop and wipe the databases: `docker compose down -v`.

## 2. Push the code to GitHub

`.env` is in `.gitignore`. Check before pushing:

```bash
git status                  # .env must NOT appear
git add .
git commit -m "Dental clinic microservices"
git push
```

## 3. Run on the Ubuntu VM (build from source)

One-time setup:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2
sudo systemctl enable --now docker
```

Get the project and configure it:

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
cp .env.example .env

# generate random JWT secrets
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" .env
sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -hex 48)|" .env

nano .env                   # change the two database passwords
```

Build and start:

```bash
sudo docker compose up --build -d
sudo docker compose ps      # all services should become "healthy"
```

Open http://localhost:8080 in the VM's browser.

## 4. Publish the images to Docker Hub

Image names come from `DOCKERHUB_USER` and `IMAGE_TAG` in `.env`
(default: `ahmadhellani/dental-clinic-<service>:v1`).

```bash
sudo docker login                       # Docker Hub username + password/token
sudo docker compose build
sudo docker compose push                # pushes authentication, backend, frontend, proxy
```

The Postgres images are official ones and are not pushed.

Check on https://hub.docker.com/u/ahmadhellani

## 5. Deploy from Docker Hub (no source code needed)

On any machine with Docker (a fresh VM or EC2), you only need `docker-compose.yml` and `.env`:

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
```

## 6. Optional: AWS EC2

Same steps as Lab 1 (Ubuntu t3.micro, open port 8080 in the security group), then section 5.
Open `http://<EC2_PUBLIC_IP>:8080`. Remember the cleanup checklist from Lab 1
(terminate instance, delete volumes, release Elastic IPs).

## Smoke test checklist

- [ ] Landing page shows treatments and dentists
- [ ] Register a new patient, land on the patient dashboard
- [ ] Book a visit with the wizard (treatment, dentist, date and slot, confirm)
- [ ] The same slot is no longer offered
- [ ] Log in as `dr.sara@...`: confirm the pending appointment, complete it, add notes
- [ ] Back as the patient: the dentist's notes are visible and a cancel works
- [ ] Log in as admin: KPIs, all appointments filters, add a treatment, add a user, add a dentist profile
- [ ] Log out, then open `/admin` directly: redirected to login

## Useful commands

```bash
docker compose ps                       # status and health
docker compose logs -f backend          # follow one service's logs
docker compose restart backend
docker compose --profile debug up -d adminer   # DB viewer at http://localhost:8081
docker system df                        # disk used by Docker
docker system prune -a                  # free disk space (removes unused images)
```

## Troubleshooting

- **`docker compose` not found on Ubuntu**: `sudo apt install docker-compose-v2`.
- **`permission denied` on the Docker socket**: use `sudo`, or `sudo usermod -aG docker $USER` and log in again.
- **Connection reset on :8080 inside the VirtualBox VM**: first `sudo systemctl restart docker`, then
  `sudo docker compose down && sudo docker compose up -d`. Test with `curl -i http://127.0.0.1:8080`.
- **Changed a database password and login or DB errors appear**: the old volume keeps the old password.
  Run `docker compose down -v` to recreate the databases.
- **Out of memory or disk during build**: `docker system prune -a`, and build one service at a time with
  `docker compose build backend`.
- **Port 8080 busy**: change `PROXY_PORT` in `.env`.