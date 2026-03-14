from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0035_merge_20260314_1658"),
    ]

    operations = [
        migrations.AlterField(
            model_name="directmessage",
            name="body",
            field=models.CharField(max_length=4096),
        ),
        migrations.AlterField(
            model_name="neighborhoodchatmessage",
            name="body",
            field=models.CharField(max_length=4096),
        ),
    ]
