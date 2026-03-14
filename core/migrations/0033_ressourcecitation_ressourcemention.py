from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0032_merge_20260314_1535"),
    ]

    operations = [
        migrations.CreateModel(
            name="RessourceCitation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(db_index=True, max_length=128)),
                ("source", models.CharField(choices=[("DOWNLOAD", "Téléchargement"), ("SHARE", "Partage")], max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("resource", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="citations", to="core.ressourcesavoir")),
            ],
            options={},
        ),
        migrations.CreateModel(
            name="RessourceMention",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(db_index=True, max_length=128)),
                ("grade", models.CharField(choices=[("PASSABLE", "Passable"), ("BIEN", "Bien"), ("TRES_BIEN", "Mention Très Bien")], max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("resource", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="mentions", to="core.ressourcesavoir")),
            ],
            options={},
        ),
        migrations.AddConstraint(
            model_name="ressourcecitation",
            constraint=models.UniqueConstraint(fields=("resource", "unique_device_id", "source"), name="unique_resource_citation_per_device_source"),
        ),
        migrations.AddConstraint(
            model_name="ressourcemention",
            constraint=models.UniqueConstraint(fields=("resource", "unique_device_id"), name="unique_resource_mention_per_device"),
        ),
    ]
