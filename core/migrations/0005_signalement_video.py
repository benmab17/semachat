from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_ressource_social_and_survey"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalement",
            name="video",
            field=models.FileField(blank=True, null=True, upload_to="signalements/videos/", verbose_name="video"),
        ),
    ]
