from locust import HttpUser, task, between


class WebsiteUser(HttpUser):
    """Basic load test for the GarageGo frontend routes."""

    wait_time = between(1, 3)

    def on_start(self):
        # Optional warmup request when a user starts
        self.client.get("/")

    @task(5)
    def view_home(self):
        self.client.get("/")

    @task(3)
    def view_auth(self):
        self.client.get("/auth")

    @task(2)
    def view_garages(self):
        self.client.get("/garages")

    @task(2)
    def view_spare_parts(self):
        self.client.get("/spare-parts")

    @task(1)
    def view_wallet(self):
        self.client.get("/wallet")

    @task(1)
    def view_admin(self):
        self.client.get("/admin")
