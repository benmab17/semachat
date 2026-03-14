from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_ressourcesavoir"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ressourcesavoir",
            name="category",
            field=models.CharField(
                choices=[
                    ("DROIT", "Droit"),
                    ("INFORMATIQUE", "Informatique"),
                    ("MEDECINE", "Medecine"),
                    ("ECONOMIE", "Economie"),
                    ("AUTRE", "Autre"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="ressourcesavoir",
            name="institution",
            field=models.CharField(
                choices=[
                    ("UNIKIN", "UNIKIN"),
                    ("UPC", "UPC"),
                    ("UNILU", "UNILU"),
                    ("UNIKIS", "UNIKIS"),
                    ("ISPA", "ISPA"),
                    ("PROVINCE", "Province"),
                    ("UNIGOM", "UNIGOM"),
                    ("UCC", "UCC"),
                    ("AUTRE", "Autre"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="ressourcesavoir",
            name="resource_link",
            field=models.URLField(blank=True),
        ),
        migrations.CreateModel(
            name="SurveyPulse",
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
                ("question_key", models.CharField(default="electricity_tonight", max_length=64)),
                ("answer", models.CharField(choices=[("YES", "Oui"), ("NO", "Non")], max_length=8)),
                ("unique_device_id", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="RessourceMerci",
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
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mercis",
                        to="core.ressourcesavoir",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="surveypulse",
            constraint=models.UniqueConstraint(
                fields=("question_key", "unique_device_id"),
                name="unique_survey_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="ressourcemerci",
            constraint=models.UniqueConstraint(
                fields=("resource", "unique_device_id"),
                name="unique_merci_per_device",
            ),
        ),
    ]
