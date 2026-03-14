from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_rename_core_signal_status_3f9459_idx_core_signal_status_f5e838_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="RessourceSavoir",
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
                            ("DROIT", "Droit"),
                            ("INFORMATIQUE", "Informatique"),
                            ("SANTE", "Sante"),
                            ("ECONOMIE", "Economie"),
                            ("ENTREPRENEURIAT", "Entrepreneuriat"),
                            ("AUTRE", "Autre"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "institution",
                    models.CharField(
                        choices=[
                            ("UNIKIN", "UNIKIN"),
                            ("UPC", "UPC"),
                            ("UNILU", "UNILU"),
                            ("UNIKIS", "UNIKIS"),
                            ("UNIGOM", "UNIGOM"),
                            ("UCC", "UCC"),
                            ("AUTRE", "Autre"),
                        ],
                        max_length=20,
                    ),
                ),
                ("title", models.CharField(max_length=160)),
                ("content", models.TextField(blank=True)),
                (
                    "tags",
                    models.CharField(
                        blank=True,
                        help_text="Tags separes par virgule",
                        max_length=180,
                    ),
                ),
                ("attachment", models.FileField("resource", blank=True, null=True, upload_to="resources/")),
                ("contributor_hash", models.CharField(db_index=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["institution", "category", "created_at"],
                        name="core_rs_inst_cat_idx",
                    ),
                    models.Index(
                        fields=["contributor_hash", "created_at"],
                        name="core_rs_contrib_idx",
                    ),
                ],
            },
        ),
    ]
