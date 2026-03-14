from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_signalementreaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalement",
            name="publish_anonymously",
            field=models.BooleanField(default=False),
        ),
    ]
