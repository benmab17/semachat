from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0017_signalement_publish_anonymously"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminbroadcast",
            name="kind",
            field=models.CharField(
                choices=[("ALERT", "Alerte"), ("SURVEY", "Sondage")],
                default="ALERT",
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name="adminbroadcast",
            name="lat",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="adminbroadcast",
            name="lng",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="adminbroadcast",
            name="question",
            field=models.CharField(blank=True, max_length=280),
        ),
    ]
