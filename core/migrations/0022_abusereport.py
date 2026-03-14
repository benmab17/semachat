from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0021_alter_signalement_category_religion"),
    ]

    operations = [
        migrations.CreateModel(
            name="AbuseReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reported_by_hash", models.CharField(db_index=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("signalement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="abuse_reports", to="core.signalement")),
                ("target_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="abuse_reports_received", to="core.citizenprofile")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="abusereport",
            index=models.Index(fields=["target_profile", "created_at"], name="core_abuser_target__a23d16_idx"),
        ),
        migrations.AddConstraint(
            model_name="abusereport",
            constraint=models.UniqueConstraint(fields=("signalement", "reported_by_hash"), name="unique_abuse_report_per_signalement_device"),
        ),
    ]
