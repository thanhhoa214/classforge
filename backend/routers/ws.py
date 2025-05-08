from fastapi import FastAPI, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.responses import HTMLResponse
import time


router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == "close":
                break
            # Simulate a long-running process
            for i in range(10):
                time.sleep(1)
                await websocket.send_text(f"Message {i + 1}")
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        await websocket.close()

# Testing ai data function
html = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WebSocket Chat Test</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    #chat { margin-bottom: 10px; }
    #messages { list-style: none; padding: 0; max-height: 400px; overflow-y: auto; }
    #messages li { padding: 5px 8px; border-bottom: 1px solid #eee; }
    input, button { padding: 8px; margin-right: 4px; }
  </style>
</head>
<body>
  <h1>WebSocket Chat Test</h1>
  <div id="chat">
    <input type="text" id="messageInput" placeholder="Type a message…" autocomplete="off" />
    <button id="sendBtn">Send</button>
    <button id="closeBtn">Close</button>
  </div>
  <ul id="messages"></ul>
  <script>
    const ws = new WebSocket(`ws://${location.host}/ws`);
    const messages = document.getElementById('messages');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const closeBtn = document.getElementById('closeBtn');

    ws.addEventListener('open', () => console.log('WS opened'));
    ws.addEventListener('message', e => {
      const li = document.createElement('li');
      li.textContent = e.data;
      messages.appendChild(li);
      messages.scrollTop = messages.scrollHeight;
    });
    ws.addEventListener('close', () => console.log('WS closed'));
    ws.addEventListener('error', err => console.error('WS error', err));

    function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;
      ws.send(msg);
      input.value = '';
    }

    sendBtn.onclick = sendMessage;
    closeBtn.onclick = () => {
      ws.send('close');
      ws.close();
    };
    input.addEventListener('keyup', e => e.key === 'Enter' && sendMessage());
  </script>
</body>
</html>
"""

@router.get("/test_chat")
async def get():
    return HTMLResponse(html)

