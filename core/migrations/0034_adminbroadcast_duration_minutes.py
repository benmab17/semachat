from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0033_ressourcecitation_ressourcemention"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminbroadcast",
            name="duration_minutes",
            field=models.PositiveIntegerField(default=30),
        ),
    ]
