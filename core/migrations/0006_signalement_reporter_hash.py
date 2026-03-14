from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_signalement_video"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalement",
            name="reporter_hash",
            field=models.CharField(blank=True, db_index=True, max_length=128),
        ),
        migrations.AddIndex(
            model_name="signalement",
            index=models.Index(fields=["reporter_hash", "created_at"], name="core_signal_reporter_idx"),
        ),
    ]
