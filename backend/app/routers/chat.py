from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.gemini_client import get_gemini_response
from app.material_snippets import MATERIAL_SNIPPETS

router = APIRouter()


@router.post("/start", response_model=schemas.ChatOut)
async def start_chat(
    chat_data: schemas.ChatCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new chat session.
    Creates a Chat row for the current user with the given subject_id.
    If title is not provided, sets it to "New chat".
    """
    # For hardcoded subjects: ensure we have a default course and subject for foreign key constraints
    # Get or create default course
    default_course = db.query(models.Course).first()
    if not default_course:
        default_course = models.Course(name="Default Course")
        db.add(default_course)
        db.commit()
        db.refresh(default_course)
    
    # Get or create a default subject (we'll use the first one or create one)
    default_subject = db.query(models.Subject).first()
    if not default_subject:
        default_subject = models.Subject(
            course_id=default_course.id,
            name="General"  # Default name, actual subject name is in chat.title
        )
        db.add(default_subject)
        db.commit()
        db.refresh(default_subject)
    
    # Use the provided subject_id or default
    subject_id = chat_data.subject_id if chat_data.subject_id else default_subject.id

    # Always start with a generic title; first user question will override it
    new_chat = models.Chat(
        user_id=current_user.id,
        subject_id=subject_id,
        title="New chat"
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    # Get the subject to include subject_name in response
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    
    return schemas.ChatOut(
        id=new_chat.id,
        title=new_chat.title,
        subject_name=subject.name if subject else None,
        created_at=new_chat.created_at,
    )


@router.get("", response_model=List[schemas.ChatOut])
async def get_chats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all chats for the current user, ordered by created_at DESC.
    Returns chat title (first user message) and subject name.
    """
    q = (
        db.query(models.Chat, models.Subject)
        .join(models.Subject, models.Chat.subject_id == models.Subject.id)
        .filter(models.Chat.user_id == current_user.id)
        .order_by(models.Chat.created_at.desc())
    )

    results = []
    for chat, subject in q.all():
        results.append(
            schemas.ChatOut(
                id=chat.id,
                title=chat.title,
                subject_name=subject.name if subject else None,
                created_at=chat.created_at,
            )
        )
    return results


@router.get("/{chat_id}/messages", response_model=List[schemas.ChatMessageOut])
async def get_chat_messages(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a chat, ordered by created_at ASC.
    Returns 403 if chat does not belong to current user.
    """
    # Verify chat belongs to user
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat not found or access denied"
        )
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.chat_id == chat_id
    ).order_by(models.ChatMessage.created_at.asc()).all()
    
    return messages


@router.post("/{chat_id}/message", response_model=schemas.ChatMessageReply)
async def send_message(
    chat_id: int,
    message_data: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message in a chat and get Gemini's reply.
    Saves both user message and bot response to the database.
    Returns 403 if chat does not belong to current user.
    """
    # Load the Chat and verify it belongs to current_user
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat not found or access denied"
        )
    
    # Load the related Subject to get its name
    subject = db.query(models.Subject).filter(models.Subject.id == chat.subject_id).first()
    
    # Get subject name from the database subject (for MATERIAL_SNIPPETS lookup)
    subject_name = subject.name if subject else "General"
    
    # Build a flat list of all snippets from all subjects
    all_snippets = []
    for subject_snips in MATERIAL_SNIPPETS.values():
        all_snippets.extend(subject_snips)
    
    # Simple relevance check: find snippets with matching keywords
    question_lower = message_data.question.lower()
    relevant_snippets = []
    for snippet in all_snippets:
        if any(keyword.lower() in question_lower for keyword in snippet["keywords"]):
            relevant_snippets.append(snippet)
            if len(relevant_snippets) >= 2:  # Take at most 2 snippets
                break
    
    # Build context text from relevant snippets
    context_text = ""
    sources = []
    if relevant_snippets:
        context_text = "Reference material:\n"
        for snippet in relevant_snippets:
            context_text += f"Title: {snippet['title']}\n"
            context_text += f"Page: {snippet['page']}\n"
            context_text += f"Content: {snippet['text']}\n\n"
            sources.append({
                "type": "snippet",
                "title": snippet["title"],
                "page": snippet["page"]
            })
    
    # Build system-style prompt for exam-oriented, subject-aware responses
    system_prompt = f"""You are a helpful AI tutor for a university student.

Subject: {subject_name}

Requirements:
- Answer in a clear, exam-oriented way.
- Structure answers like 5–10 mark exam answers when appropriate.
- If the question is off-topic from this subject, briefly answer then guide the student back to the subject."""

    # Build the final prompt with context if available
    if context_text:
        full_prompt = f"{system_prompt}\n\n{context_text}Student question: {message_data.question}"
    else:
        full_prompt = f"{system_prompt}\n\nStudent question: {message_data.question}"
    
    # Insert user message
    user_message = models.ChatMessage(
        chat_id=chat_id,
        sender="USER",
        message=message_data.question
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Auto-title chat on first message
    updated_title = None
    if chat.title in ("New chat", None, subject_name):
        # Create title from first few words of the question, max ~40 chars
        title = message_data.question.strip()
        if len(title) > 40:
            title = title[:40].rsplit(" ", 1)[0]
        chat.title = title
        updated_title = title
        db.commit()
        db.refresh(chat)


    
    # Call Gemini API with the full prompt
    try:
        answer_text = await get_gemini_response(full_prompt)
    except Exception as e:
        answer_text = f"Error: {str(e)}"
    
    # Insert bot message
    bot_message = models.ChatMessage(
        chat_id=chat_id,
        sender="BOT",
        message=answer_text,
        sources=sources or None
    )
    db.add(bot_message)
    db.commit()
    db.refresh(bot_message)
    
    # Return response with answer, sources, and updated title if applicable
    return {
        "answer": answer_text,
        "sources": sources,
        "chat_title": updated_title
    }
