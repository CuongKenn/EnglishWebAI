"""
AI Virtual Room API Router
Provides endpoints for AI-powered English learning rooms
"""
import secrets
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.ai_virtual_room import (
    AIVirtualRoom,
    AIRoomParticipant,
    AIRoomMessage,
    AIRoomSession,
    ConversationTopic,
)
from app.models.user import User
from app.schemas.ai_virtual_room import (
    AIVirtualRoomCreate,
    AIVirtualRoomResponse,
    AIVirtualRoomDetail,
    AIRoomJoin,
    AIRoomParticipantResponse,
    AIRoomParticipantUpdate,
    AIRoomMessageCreate,
    AIRoomMessageResponse,
    AIRoomSessionCreate,
    AIRoomSessionResponse,
    AIRoomSessionEnd,
    ConversationTopicCreate,
    ConversationTopicResponse,
    AIConversationRequest,
    AIConversationResponse,
    PronunciationAnalysisRequest,
    PronunciationAnalysisResponse,
)
from app.services.ai_virtual_room_service import ai_virtual_room_service
import json

router = APIRouter()


# WebSocket connection manager
class AIRoomConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, List[WebSocket]] = {}  # room_id -> [websockets]
    
    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
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


manager = AIRoomConnectionManager()


def generate_room_code() -> str:
    """Generate a unique 6-character room code"""
    return secrets.token_urlsafe(6)[:6].upper()


# === ROOM MANAGEMENT ENDPOINTS ===

@router.post("/rooms", response_model=AIVirtualRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_room(
    room_data: AIVirtualRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI Virtual Room"""
    room_code = generate_room_code()
    
    # Ensure unique room code
    while db.query(AIVirtualRoom).filter(AIVirtualRoom.room_code == room_code).first():
        room_code = generate_room_code()
    
    # Set default AI teacher persona if not provided
    if not room_data.ai_teacher_persona:
        room_data.ai_teacher_persona = {
            "name": "AI Teacher",
            "style": "friendly",
            "avatar": "🤖"
        }
    
    ai_room = AIVirtualRoom(
        **room_data.model_dump(),
        created_by=current_user.id,
        room_code=room_code
    )
    db.add(ai_room)
    db.commit()
    db.refresh(ai_room)
    
    # Auto-join creator
    participant = AIRoomParticipant(
        room_id=ai_room.id,
        user_id=current_user.id,
        is_online=True
    )
    db.add(participant)
    db.commit()
    
    return ai_room


@router.get("/rooms", response_model=List[AIVirtualRoomResponse])
async def get_ai_rooms(
    room_type: Optional[str] = None,
    level: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all AI Virtual Rooms"""
    query = db.query(AIVirtualRoom).filter(AIVirtualRoom.is_active == is_active)
    
    if room_type:
        query = query.filter(AIVirtualRoom.room_type == room_type)
    if level:
        query = query.filter(AIVirtualRoom.level == level)
    
    rooms = query.order_by(desc(AIVirtualRoom.created_at)).all()
    return rooms


@router.get("/rooms/{room_id}", response_model=AIVirtualRoomDetail)
async def get_ai_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI Virtual Room details"""
    room = db.query(AIVirtualRoom).filter(AIVirtualRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="AI Virtual Room not found")
    
    # Get participants with user info
    participants = db.query(AIRoomParticipant, User).join(
        User, AIRoomParticipant.user_id == User.id
    ).filter(AIRoomParticipant.room_id == room_id).all()
    
    participant_list = []
    for participant, user in participants:
        participant_list.append({
            "id": participant.id,
            "user_id": user.id,
            "username": user.username,
            "nickname": participant.nickname,
            "joined_at": participant.joined_at,
            "left_at": participant.left_at,
            "is_online": participant.is_online,
            "is_speaking": participant.is_speaking,
            "is_audio_on": participant.is_audio_on,
            "total_speaking_time": participant.total_speaking_time,
            "pronunciation_score": participant.pronunciation_score,
            "grammar_score": participant.grammar_score,
            "fluency_score": participant.fluency_score,
        })
    
    # Check for active session
    active_session = db.query(AIRoomSession).filter(
        AIRoomSession.room_id == room_id,
        AIRoomSession.user_id == current_user.id,
        AIRoomSession.ended_at == None
    ).first()
    
    return {
        **room.__dict__,
        "participants": participant_list,
        "participant_count": len(participant_list),
        "active_session": active_session
    }


@router.post("/rooms/join", response_model=AIVirtualRoomResponse)
async def join_ai_room(
    join_data: AIRoomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join an AI Virtual Room by room code"""
    room = db.query(AIVirtualRoom).filter(
        AIVirtualRoom.room_code == join_data.room_code,
        AIVirtualRoom.is_active == True
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="AI Virtual Room not found")
    
    # Check if already a participant
    existing = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room.id,
        AIRoomParticipant.user_id == current_user.id
    ).first()
    
    if existing:
        existing.is_online = True
        existing.left_at = None
        db.commit()
        return room
    
    # Check participant limit
    participant_count = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room.id,
        AIRoomParticipant.left_at == None
    ).count()
    
    if participant_count >= room.max_participants:
        raise HTTPException(status_code=400, detail="AI Virtual Room is full")
    
    # Add participant
    participant = AIRoomParticipant(
        room_id=room.id,
        user_id=current_user.id,
        nickname=join_data.nickname,
        is_online=True
    )
    db.add(participant)
    db.commit()
    
    return room


@router.post("/rooms/{room_id}/leave")
async def leave_ai_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave an AI Virtual Room"""
    participant = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room_id,
        AIRoomParticipant.user_id == current_user.id
    ).first()
    
    if participant:
        participant.is_online = False
        participant.left_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Left room successfully"}


# === MESSAGE ENDPOINTS ===

@router.post("/rooms/{room_id}/messages", response_model=AIRoomMessageResponse)
async def send_message(
    room_id: int,
    message_data: AIRoomMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in AI Virtual Room"""
    # Verify participant
    participant = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room_id,
        AIRoomParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    
    # Get room info
    room = db.query(AIVirtualRoom).filter(AIVirtualRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Create user message
    user_message = AIRoomMessage(
        room_id=room_id,
        sender_id=current_user.id,
        sender_type="user",
        **message_data.model_dump()
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Broadcast user message
    await manager.broadcast({
        "type": "message",
        "data": {
            **user_message.__dict__,
            "sender_name": current_user.username
        }
    }, room_id)
    
    # Generate AI response
    conversation_history = db.query(AIRoomMessage).filter(
        AIRoomMessage.room_id == room_id
    ).order_by(desc(AIRoomMessage.created_at)).limit(20).all()
    
    history = [
        {
            "role": "user" if msg.sender_type == "user" else "assistant",
            "content": msg.content
        }
        for msg in reversed(conversation_history)
    ]
    
    ai_response = await ai_virtual_room_service.generate_ai_response(
        message=message_data.content,
        conversation_history=history,
        room_type=room.room_type,
        level=room.level,
        topic=room.topic,
        enable_grammar_correction=room.enable_grammar_correction,
        enable_vocabulary_hints=room.enable_vocabulary_hints
    )
    
    # Save AI message
    ai_message = AIRoomMessage(
        room_id=room_id,
        sender_id=None,
        sender_type="ai_teacher",
        message_type="text",
        content=ai_response["message"]
    )
    db.add(ai_message)
    
    # Save grammar corrections as separate messages if any
    if ai_response.get("grammar_corrections"):
        user_message.grammar_issues = ai_response["grammar_corrections"]
    
    if ai_response.get("vocabulary_hints"):
        user_message.suggestions = ai_response["vocabulary_hints"]
    
    db.commit()
    db.refresh(ai_message)
    
    # Broadcast AI response
    await manager.broadcast({
        "type": "ai_response",
        "data": {
            **ai_message.__dict__,
            "sender_name": room.ai_teacher_persona.get("name", "AI Teacher"),
            "grammar_corrections": ai_response.get("grammar_corrections"),
            "vocabulary_hints": ai_response.get("vocabulary_hints")
        }
    }, room_id)
    
    return {
        **user_message.__dict__,
        "sender_name": current_user.username
    }


@router.get("/rooms/{room_id}/messages", response_model=List[AIRoomMessageResponse])
async def get_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages from AI Virtual Room"""
    # Verify participant
    participant = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room_id,
        AIRoomParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    
    # Get room for AI teacher name
    room = db.query(AIVirtualRoom).filter(AIVirtualRoom.id == room_id).first()
    ai_teacher_name = room.ai_teacher_persona.get("name", "AI Teacher") if room and room.ai_teacher_persona else "AI Teacher"
    
    messages = db.query(AIRoomMessage).outerjoin(
        User, AIRoomMessage.sender_id == User.id
    ).filter(
        AIRoomMessage.room_id == room_id
    ).order_by(desc(AIRoomMessage.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for message in messages:
        sender_name = None
        if message.sender_type == "user" and message.sender_id:
            user = db.query(User).filter(User.id == message.sender_id).first()
            sender_name = user.username if user else "Unknown"
        elif message.sender_type == "ai_teacher":
            sender_name = ai_teacher_name
        
        result.append({
            **message.__dict__,
            "sender_name": sender_name
        })
    
    return list(reversed(result))


# === SESSION ENDPOINTS ===

@router.post("/sessions/start", response_model=AIRoomSessionResponse)
async def start_session(
    session_data: AIRoomSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a practice session"""
    # Check if already has active session
    active_session = db.query(AIRoomSession).filter(
        AIRoomSession.room_id == session_data.room_id,
        AIRoomSession.user_id == current_user.id,
        AIRoomSession.ended_at == None
    ).first()
    
    if active_session:
        return active_session
    
    session = AIRoomSession(
        room_id=session_data.room_id,
        user_id=current_user.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session


@router.post("/sessions/{session_id}/end", response_model=AIRoomSessionResponse)
async def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End a practice session and get summary"""
    session = db.query(AIRoomSession).filter(
        AIRoomSession.id == session_id,
        AIRoomSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.ended_at:
        return session
    
    # Calculate duration
    session.ended_at = datetime.utcnow()
    duration = int((session.ended_at - session.started_at).total_seconds())
    session.duration = duration
    
    # Get room and messages
    room = db.query(AIVirtualRoom).filter(AIVirtualRoom.id == session.room_id).first()
    messages = db.query(AIRoomMessage).filter(
        AIRoomMessage.room_id == session.room_id,
        AIRoomMessage.sender_id == current_user.id,
        AIRoomMessage.created_at >= session.started_at
    ).all()
    
    session.messages_sent = len(messages)
    
    # Generate AI summary
    message_data = [
        {
            "sender_type": msg.sender_type,
            "content": msg.content
        }
        for msg in messages
    ]
    
    summary = await ai_virtual_room_service.generate_session_summary(
        messages=message_data,
        duration=duration,
        level=room.level if room else "intermediate"
    )
    
    session.session_summary = summary.get("summary")
    session.strengths = summary.get("strengths")
    session.areas_to_improve = summary.get("areas_to_improve")
    session.recommended_topics = summary.get("recommended_topics")
    
    db.commit()
    db.refresh(session)
    
    return session


@router.get("/sessions/my-sessions", response_model=List[AIRoomSessionResponse])
async def get_my_sessions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's practice sessions"""
    sessions = db.query(AIRoomSession).filter(
        AIRoomSession.user_id == current_user.id
    ).order_by(desc(AIRoomSession.started_at)).limit(limit).all()
    
    return sessions


# === CONVERSATION TOPICS ===

@router.get("/topics", response_model=List[ConversationTopicResponse])
async def get_conversation_topics(
    level: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available conversation topics"""
    query = db.query(ConversationTopic).filter(ConversationTopic.is_active == True)
    
    if level:
        query = query.filter(ConversationTopic.level == level)
    if category:
        query = query.filter(ConversationTopic.category == category)
    
    topics = query.all()
    return topics


@router.post("/topics", response_model=ConversationTopicResponse)
async def create_conversation_topic(
    topic_data: ConversationTopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation topic (admin/teacher only)"""
    if current_user.role not in ["admin", "teacher", "superadmin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    topic = ConversationTopic(**topic_data.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    
    return topic


# === WEBSOCKET ===

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket connection for real-time AI Virtual Room"""
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
    participant = db.query(AIRoomParticipant).filter(
        AIRoomParticipant.room_id == room_id,
        AIRoomParticipant.user_id == user_id
    ).first()
    
    if not participant:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, room_id)
    
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
            if message["type"] == "audio_toggle":
                participant.is_audio_on = message["is_on"]
                db.commit()
                await manager.broadcast({
                    "type": "audio_toggle",
                    "user_id": user_id,
                    "is_on": message["is_on"]
                }, room_id)
            
            elif message["type"] == "speaking_toggle":
                participant.is_speaking = message["is_speaking"]
                db.commit()
                await manager.broadcast({
                    "type": "speaking_toggle",
                    "user_id": user_id,
                    "is_speaking": message["is_speaking"]
                }, room_id)
            
            else:
                # Broadcast other messages
                await manager.broadcast(message, room_id)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        participant.is_online = False
        participant.is_speaking = False
        participant.is_audio_on = False
        db.commit()
        
        # Notify others that user left
        await manager.broadcast({
            "type": "user_left",
            "data": {
                "user_id": user_id,
                "username": user.username
            }
        }, room_id)


