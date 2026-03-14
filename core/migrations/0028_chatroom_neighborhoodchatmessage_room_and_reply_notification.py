from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0027_signalementmoodreaction"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChatRoom",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("label", models.CharField(max_length=120)),
                ("province_key", models.CharField(blank=True, max_length=32)),
                ("kind", models.CharField(choices=[("NEIGHBORHOOD", "Quartier"), ("COMMUNE", "Commune"), ("CITY", "Ville"), ("PROVINCE", "Province")], default="NEIGHBORHOOD", max_length=24)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["label"],
            },
        ),
        migrations.AddIndex(
            model_name="chatroom",
            index=models.Index(fields=["province_key", "label"], name="core_chatro_provinc_6b0b19_idx"),
        ),
        migrations.AddField(
            model_name="neighborhoodchatmessage",
            name="room",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="messages", to="core.chatroom"),
        ),
    ]
