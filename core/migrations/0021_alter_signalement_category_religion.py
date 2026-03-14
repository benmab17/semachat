from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_signalement_is_poll_signalementpollvote"),
    ]

    operations = [
        migrations.AlterField(
            model_name="signalement",
            name="category",
            field=models.CharField(
                choices=[
                    ("ENERGIE", "Energie"),
                    ("EAU", "Eau"),
                    ("INFRA", "Infrastructure"),
                    ("FRAIS", "Frais illegaux"),
                    ("INSECURITE", "Insecurite"),
                    ("CONSTITUTION", "Constitution"),
                    ("POLITIQUE", "Politique"),
                    ("RELIGION", "Religion"),
                ],
                max_length=20,
            ),
        ),
    ]
