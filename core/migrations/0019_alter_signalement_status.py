from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0018_adminbroadcast_survey_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="signalement",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Signale"),
                    ("VALIDATED", "Verifie"),
                    ("RESOLVED", "Resolu"),
                ],
                default="PENDING",
                max_length=12,
            ),
        ),
    ]
