from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_abusereport"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalement",
            name="hidden_by_moderation",
            field=models.BooleanField(default=False),
        ),
    ]
