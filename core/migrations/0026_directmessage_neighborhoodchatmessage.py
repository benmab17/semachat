from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0025_rename_core_abuser_target__a23d16_idx_core_abuser_target__3c30e2_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DirectMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("conversation_key", models.CharField(db_index=True, max_length=260)),
                ("sender_hash", models.CharField(db_index=True, max_length=128)),
                ("recipient_hash", models.CharField(db_index=True, max_length=128)),
                ("body", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["created_at"],
                "indexes": [
                    models.Index(fields=["recipient_hash", "created_at"], name="core_direct_recipie_dcc4d0_idx"),
                    models.Index(fields=["sender_hash", "created_at"], name="core_direct_sender__363377_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="NeighborhoodChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("room_key", models.CharField(db_index=True, max_length=120)),
                ("room_label", models.CharField(max_length=120)),
                ("province_key", models.CharField(blank=True, max_length=32)),
                ("sender_hash", models.CharField(db_index=True, max_length=128)),
                ("body", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["created_at"],
                "indexes": [
                    models.Index(fields=["room_key", "created_at"], name="core_neighb_room_ke_52b146_idx"),
                    models.Index(fields=["sender_hash", "created_at"], name="core_neighb_sender__8bd634_idx"),
                ],
            },
        ),
    ]
