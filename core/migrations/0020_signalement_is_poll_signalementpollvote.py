from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0019_alter_signalement_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalement",
            name="is_poll",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="SignalementPollVote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("unique_device_id", models.CharField(max_length=128)),
                ("answer", models.CharField(choices=[("YES", "Oui"), ("NO", "Non")], max_length=8)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("signalement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="poll_votes", to="core.signalement")),
            ],
            options={},
        ),
        migrations.AddConstraint(
            model_name="signalementpollvote",
            constraint=models.UniqueConstraint(fields=("signalement", "unique_device_id"), name="unique_poll_vote_per_signalement_device"),
        ),
    ]
