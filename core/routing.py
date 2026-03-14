from django.urls import path

from .consumers import SemaRealtimeConsumer


websocket_urlpatterns = [
    path("ws/semachat/", SemaRealtimeConsumer.as_asgi()),
]
