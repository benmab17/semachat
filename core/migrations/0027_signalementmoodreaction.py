from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0026_directmessage_neighborhoodchatmessage"),
    ]

    operations = [
        migrations.CreateModel(
            name="SignalementMoodReaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(db_index=True, max_length=128)),
                ("mood", models.CharField(choices=[("SUPPORT", "Support"), ("SAD", "Compassion")], max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("signalement", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="mood_reactions", to="core.signalement")),
            ],
            options={
                "indexes": [
                    models.Index(fields=["signalement", "mood", "created_at"], name="core_signal_signale_3adf38_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="signalementmoodreaction",
            constraint=models.UniqueConstraint(fields=("signalement", "unique_device_id"), name="unique_mood_reaction_per_signalement_device"),
        ),
    ]
