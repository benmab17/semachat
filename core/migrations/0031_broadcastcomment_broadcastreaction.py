from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_adminbroadcast_title"),
    ]

    operations = [
        migrations.CreateModel(
            name="BroadcastComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(db_index=True, max_length=128)),
                ("body", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("broadcast", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="comments", to="core.adminbroadcast")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.AddIndex(
            model_name="broadcastcomment",
            index=models.Index(fields=["broadcast", "created_at"], name="core_broadc_broadca_a24915_idx"),
        ),
        migrations.CreateModel(
            name="BroadcastReaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(db_index=True, max_length=128)),
                ("kind", models.CharField(choices=[("CONFIRM", "Je confirme"), ("DISAGREE", "Pas d'accord")], max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("broadcast", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="reactions", to="core.adminbroadcast")),
            ],
        ),
        migrations.AddConstraint(
            model_name="broadcastreaction",
            constraint=models.UniqueConstraint(fields=("broadcast", "unique_device_id"), name="unique_broadcast_reaction_per_device"),
        ),
        migrations.AddIndex(
            model_name="broadcastreaction",
            index=models.Index(fields=["broadcast", "kind", "created_at"], name="core_broadc_broadca_166210_idx"),
        ),
    ]
