"""
Chat Room API Router with WebSocket support
Supports text chat, video call, screen sharing with WebRTC
"""
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import json

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.chat_room import ChatRoom, ChatParticipant, ChatMessage
from app.models.user import User
from app.schemas.chat_room import (
    ChatRoomCreate,
    ChatRoomResponse,
    ChatRoomDetail,
    ChatRoomJoin,
    ChatParticipantResponse,
    ChatParticipantUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
)

router = APIRouter()


def get_online_participant_count(db: Session, room_id: int) -> int:
    return (
        db.query(func.count(ChatParticipant.id))
        .filter(
            ChatParticipant.room_id == room_id,
            ChatParticipant.is_online == True  # noqa: E712
        )
        .scalar()
    ) or 0


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, List[WebSocket]] = {}  # room_id -> [websockets]
        self.user_connections: dict[tuple[int, int], WebSocket] = {}  # (room_id, user_id) -> websocket
    
    async def connect(self, websocket: WebSocket, room_id: int, user_id: int = None):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        
        # Track user-specific connection
        if user_id is not None:
            self.user_connections[(room_id, user_id)] = websocket
    
    def disconnect(self, websocket: WebSocket, room_id: int, user_id: int = None):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        # Remove user-specific connection
        if user_id is not None and (room_id, user_id) in self.user_connections:
            del self.user_connections[(room_id, user_id)]
    
    async def broadcast(self, message: dict, room_id: int):
        if room_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                self.disconnect(dead, room_id)
    
    async def broadcast_to_user(self, message: dict, room_id: int, target_user_id: int):
        """Send message only to a specific user in a room"""
        connection = self.user_connections.get((room_id, target_user_id))
        if connection:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to user {target_user_id}: {e}")
                # Optionally remove dead connection here
                if (room_id, target_user_id) in self.user_connections:
                    del self.user_connections[(room_id, target_user_id)]


manager = ConnectionManager()


def generate_room_code() -> str:
    """Generate a unique 6-character room code"""
    return secrets.token_urlsafe(6)[:6].upper()


@router.post("/rooms", response_model=ChatRoomResponse, status_code=status.HTTP_201_CREATED)
def create_chat_room(
    room_data: ChatRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat room"""
    room_code = generate_room_code()
    
    # Ensure unique room code
    while db.query(ChatRoom).filter(ChatRoom.room_code == room_code).first():
        room_code = generate_room_code()
    
    chat_room = ChatRoom(
        **room_data.model_dump(),
        created_by=current_user.id,
        room_code=room_code
    )
    db.add(chat_room)
    db.commit()
    db.refresh(chat_room)
    
    # Auto-join creator
    participant = ChatParticipant(
        room_id=chat_room.id,
        user_id=current_user.id,
        is_online=True
    )
    db.add(participant)
    db.commit()
    
    chat_room.participant_count = get_online_participant_count(db, chat_room.id)
    return chat_room


@router.get("/rooms", response_model=List[ChatRoomResponse])
def get_chat_rooms(
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active chat rooms"""
    rooms = db.query(ChatRoom).filter(
        ChatRoom.is_active == is_active
    ).order_by(desc(ChatRoom.created_at)).all()

    if rooms:
        room_ids = [room.id for room in rooms]
        counts = (
            db.query(
                ChatParticipant.room_id,
                func.count(ChatParticipant.id)
            )
            .filter(
                ChatParticipant.room_id.in_(room_ids),
                ChatParticipant.is_online == True  # noqa: E712
            )
            .group_by(ChatParticipant.room_id)
            .all()
        )
        count_map = {room_id: count for room_id, count in counts}
        for room in rooms:
            room.participant_count = count_map.get(room.id, 0)

    return rooms


@router.get("/rooms/{room_id}", response_model=ChatRoomDetail)
def get_chat_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat room details with participants"""
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Get participants with user info
    participants = db.query(ChatParticipant, User).join(
        User, ChatParticipant.user_id == User.id
    ).filter(ChatParticipant.room_id == room_id).all()
    
    participant_list = []
    for participant, user in participants:
        participant_list.append({
            "id": participant.id,
            "user_id": user.id,
            "username": user.username,
            "nickname": participant.nickname,
            "joined_at": participant.joined_at,
            "is_online": participant.is_online,
            "is_video_on": participant.is_video_on,
            "is_audio_on": participant.is_audio_on,
            "peer_id": participant.peer_id
        })
    
    return {
        **room.__dict__,
        "participants": participant_list,
        "participant_count": len(participant_list)
    }


@router.post("/rooms/join", response_model=ChatRoomResponse)
def join_chat_room(
    join_data: ChatRoomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join a chat room by room code"""
    room = db.query(ChatRoom).filter(
        ChatRoom.room_code == join_data.room_code,
        ChatRoom.is_active == True
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check if already a participant
    existing = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room.id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if existing:
        existing.is_online = True
        db.commit()
        room.participant_count = get_online_participant_count(db, room.id)
        return room
    
    # Check participant limit
    participant_count = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room.id
    ).count()
    
    if participant_count >= room.max_participants:
        raise HTTPException(status_code=400, detail="Chat room is full")
    
    # Add participant
    participant = ChatParticipant(
        room_id=room.id,
        user_id=current_user.id,
        nickname=join_data.nickname,
        is_online=True
    )
    db.add(participant)
    db.commit()
    
    return room


@router.patch("/participants/{participant_id}", response_model=ChatParticipantResponse)
def update_participant(
    participant_id: int,
    update_data: ChatParticipantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update participant settings (nickname, video/audio status, peer_id)"""
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.id == participant_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(participant, field, value)
    
    db.commit()
    db.refresh(participant)
    
    # Get user info
    user = db.query(User).filter(User.id == participant.user_id).first()
    
    return {
        **participant.__dict__,
        "username": user.username
    }


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    room_id: int,
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to chat room"""
    # Verify participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    
    # Create message
    message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        **message_data.model_dump()
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Broadcast to WebSocket connections
    await manager.broadcast({
        "type": "message",
        "data": {
            "id": message.id,
            "room_id": message.room_id,
            "sender_id": message.sender_id,
            "sender_name": current_user.username,
            "message_type": message.message_type,
            "content": message.content,
            "media_url": message.media_url,
            "created_at": message.created_at.isoformat(),
            "is_deleted": message.is_deleted
        }
    }, room_id)
    
    return {
        **message.__dict__,
        "sender_name": current_user.username
    }


@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat messages"""
    # Verify participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    
    messages = db.query(ChatMessage, User).join(
        User, ChatMessage.sender_id == User.id
    ).filter(
        ChatMessage.room_id == room_id,
        ChatMessage.is_deleted == False
    ).order_by(desc(ChatMessage.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for message, user in messages:
        result.append({
            **message.__dict__,
            "sender_name": user.username
        })
    
    return list(reversed(result))  # Oldest first


@router.get("/rooms/{room_id}/participants", response_model=List[ChatParticipantResponse])
def get_participants(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all participants in a chat room"""
    # Verify participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    
    participants = db.query(ChatParticipant, User).join(
        User, ChatParticipant.user_id == User.id
    ).filter(
        ChatParticipant.room_id == room_id
    ).all()
    
    result = []
    for part, user in participants:
        result.append({
            **part.__dict__,
            "username": user.username,
            "user": {"username": user.username, "id": user.id}
        })
    
    return result


@router.patch("/rooms/{room_id}/theme")
def update_room_theme(
    room_id: int,
    theme: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update room theme (light/dark)"""
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Only creator can change theme
    if room.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only room creator can change theme")
    
    room.theme = theme
    db.commit()
    
    return {"message": "Theme updated successfully", "theme": theme}


@router.delete("/rooms/{room_id}")
def delete_chat_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a chat room"""
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Only creator can delete
    if room.created_by != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    db.delete(room)
    db.commit()
    
    return {"message": "Chat room deleted successfully"}


# WebSocket endpoint
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket connection for real-time chat and WebRTC signaling"""
    # Verify token and get user
    try:
        from app.core.security import verify_token
        payload = verify_token(token)
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Verify participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.room_id == room_id,
        ChatParticipant.user_id == user_id
    ).first()
    
    if not participant:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    participant.is_online = True
    db.commit()

    await manager.connect(websocket, room_id, user_id)
    
    # Notify others that user joined
    await manager.broadcast({
        "type": "user_joined",
        "data": {
            "user_id": user_id,
            "username": user.username,
            "nickname": participant.nickname
        }
    }, room_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] in {"message", "image"}:
                message_type = message.get("message_type", "text")
                if message["type"] == "image":
                    message_type = "image"

                # Save message to database
                new_message = ChatMessage(
                    room_id=room_id,
                    sender_id=user_id,
                    message_type=message_type,
                    content=message.get("content", ""),
                    media_url=message.get("media_url") or message.get("filename")
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                payload = {
                    "id": new_message.id,
                    "room_id": new_message.room_id,
                    "sender_id": new_message.sender_id,
                    "sender_name": user.username,
                    "message_type": new_message.message_type,
                    "content": new_message.content,
                    "media_url": new_message.media_url,
                    "created_at": new_message.created_at.isoformat(),
                }

                # Broadcast message with full user info
                await manager.broadcast({
                    "type": "message",
                    "data": payload
                }, room_id)

            elif message["type"] == "peer_signal":
                # WebRTC signaling - send only to the target peer, NOT to all users
                # The message should have from_id and to_id
                from_id = message.get("from_id")
                to_id = message.get("to_id")
                
                if from_id and to_id and from_id != to_id:
                    # Only broadcast to specific recipient
                    print(f"[DEBUG] Peer signal from {from_id} to {to_id}")
                    await manager.broadcast_to_user(message, room_id, target_user_id=to_id)
                else:
                    # Fallback: broadcast to all (shouldn't happen)
                    print(f"[DEBUG] Peer signal with missing IDs - broadcasting to all")
                    await manager.broadcast(message, room_id)
            elif message["type"] == "video_toggle":
                participant.is_video_on = message["is_on"]
                db.commit()
                await manager.broadcast({
                    "type": "video_toggle",
                    "user_id": user_id,
                    "is_on": message["is_on"]
                }, room_id)
            elif message["type"] == "audio_toggle":
                participant.is_audio_on = message["is_on"]
                db.commit()
                await manager.broadcast({
                    "type": "audio_toggle",
                    "user_id": user_id,
                    "is_on": message["is_on"]
                }, room_id)
            elif message["type"] == "screen_share_toggle":
                # Handle screen sharing toggle
                await manager.broadcast({
                    "type": "screen_share_toggle",
                    "data": {
                        "user_id": user_id,
                        "is_on": message.get("is_on")
                    }
                }, room_id)
            elif message["type"] == "user_left_manual":
                participant.is_online = False
                db.commit()
                await manager.broadcast({
                    "type": "user_left",
                    "data": {
                        "user_id": user_id,
                        "username": user.username
                    }
                }, room_id)
                await websocket.close()
                break
            else:
                # Broadcast other messages (peer_signal, etc.)
                await manager.broadcast(message, room_id)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user_id)
        participant.is_online = False
        db.commit()
        
        # Notify others that user left
        await manager.broadcast({
            "type": "user_left",
            "data": {
                "user_id": user_id,
                "username": user.username
            }
        }, room_id)
