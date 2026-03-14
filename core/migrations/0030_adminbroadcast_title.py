from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0029_adminbroadcast_target_room"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminbroadcast",
            name="title",
            field=models.CharField(blank=True, max_length=140),
        ),
    ]
