from django.db import migrations, models
import django.db.models.deletion

try:
    from cloudinary.models import CloudinaryField
except ImportError:
    from django.db.models import ImageField as CloudinaryField


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Signalement",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("ENERGIE", "Energie"),
                            ("EAU", "Eau"),
                            ("INFRA", "Infrastructure"),
                            ("FRAIS", "Frais illegaux"),
                            ("INSECURITE", "Insecurite"),
                        ],
                        max_length=20,
                    ),
                ),
                ("title", models.CharField(max_length=140)),
                ("description", models.TextField()),
                ("image", CloudinaryField("image", blank=True, null=True)),
                ("lat", models.DecimalField(decimal_places=6, max_digits=9)),
                ("lng", models.DecimalField(decimal_places=6, max_digits=9)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "En attente"),
                            ("VALIDATED", "Valide"),
                            ("RESOLVED", "Resolue"),
                        ],
                        default="PENDING",
                        max_length=12,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["status", "created_at"], name="core_signal_status_3f9459_idx"),
                    models.Index(fields=["lat", "lng"], name="core_signal_lat_7a7325_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="Validation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("unique_device_id", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "signalement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="validations",
                        to="core.signalement",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="validation",
            constraint=models.UniqueConstraint(
                fields=("signalement", "unique_device_id"),
                name="unique_validation_per_device",
            ),
        ),
    ]
