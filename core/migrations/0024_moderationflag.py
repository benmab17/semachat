from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0023_signalement_hidden_by_moderation"),
    ]

    operations = [
        migrations.CreateModel(
            name="ModerationFlag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("device_hash", models.CharField(db_index=True, max_length=128)),
                ("kind", models.CharField(choices=[("BLOCKED_TEXT", "Texte bloque")], default="BLOCKED_TEXT", max_length=24)),
                ("reason", models.CharField(max_length=220)),
                ("excerpt", models.CharField(blank=True, max_length=280)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("target_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="moderation_flags", to="core.citizenprofile")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="moderationflag",
            index=models.Index(fields=["target_profile", "created_at"], name="core_modera_target__d46837_idx"),
        ),
        migrations.AddIndex(
            model_name="moderationflag",
            index=models.Index(fields=["device_hash", "created_at"], name="core_modera_device__057af4_idx"),
        ),
    ]
