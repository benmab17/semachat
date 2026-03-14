from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0028_chatroom_neighborhoodchatmessage_room_and_reply_notification"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminbroadcast",
            name="target_province_key",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="adminbroadcast",
            name="target_room_key",
            field=models.CharField(blank=True, db_index=True, max_length=120),
        ),
        migrations.AddField(
            model_name="adminbroadcast",
            name="target_room_label",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
