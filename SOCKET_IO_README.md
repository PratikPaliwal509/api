# Real-time Notifications with Socket.io

## How it works
- The backend uses socket.io for real-time communication.
- When a user connects via socket.io, they must emit an `identify` event with their user ID to join their own room (e.g., `user_123`).
- When a notification is created for a user (or admin), the backend emits a `notification` event to the corresponding room.

## Example (Frontend)
```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:YOUR_PORT');

// After authenticating and knowing the userId:
socket.emit('identify', userId);

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Show in UI, etc.
});
```

## Backend
- See `src/server.js` for socket.io setup and user room logic.
- See `src/services/notification.service.js` for notification emission.

## Test
1. Start the backend server.
2. Connect a socket.io client, emit `identify` with your userId.
3. Trigger a notification (e.g., via API or admin panel).
4. You should receive a real-time `notification` event.
