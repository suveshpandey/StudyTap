# -----------------------------------------------------------------------------
# File: chat.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Chat router for managing chat sessions, messages, and RAG-based AI responses
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, get_current_student
from app.gemini_client import get_gemini_response

router = APIRouter()


@router.post("/start", response_model=schemas.ChatOut)
async def start_chat(
    chat_data: schemas.ChatCreate,
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Start a new chat session (students only).
    Creates a Chat row for the current student with the given subject_id.
    Validates that subject belongs to student's university.
    get_current_student ensures student is active and their university is active.
    """
    
    # Validate subject_id is provided
    if not chat_data.subject_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="subject_id is required"
        )
    
    # Validate that the subject exists and belongs to student's university
    subject = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(
            models.Subject.id == chat_data.subject_id,
            models.Branch.university_id == current_user.university_id
        )
        .first()
    )
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subject not found or does not belong to your university"
        )

    # Always start with a generic title; first user question will override it
    new_chat = models.Chat(
        student_id=current_user.id,
        subject_id=chat_data.subject_id,
        title="New chat"
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return schemas.ChatOut(
        id=new_chat.id,
        title=new_chat.title,
        subject_name=subject.name if subject else None,
        created_at=new_chat.created_at,
    )


@router.get("", response_model=List[schemas.ChatOut])
async def get_chats(
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all chats for the current student, ordered by created_at DESC (students only).
    Returns chat title (first user message) and subject name.
    get_current_student ensures student is active and their university is active.
    """
    q = (
        db.query(models.Chat, models.Subject)
        .join(models.Subject, models.Chat.subject_id == models.Subject.id)
        .filter(models.Chat.student_id == current_user.id)
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
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a chat, ordered by created_at ASC (students only).
    Returns 403 if chat does not belong to current student.
    get_current_student ensures student is active and their university is active.
    """
    # Verify chat belongs to student
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.student_id == current_user.id
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
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Send a message in a chat and get Gemini's reply (students only).
    Saves both user message and bot response to the database.
    Returns 403 if chat does not belong to current student.
    get_current_student ensures student is active and their university is active.
    """
    
    # Load the Chat and verify it belongs to current_user
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.student_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chat not found or access denied"
        )
    
    # Load the related Subject, Semester, and Branch to verify university access
    subject = (
        db.query(models.Subject)
        .join(models.Semester, models.Subject.semester_id == models.Semester.id)
        .join(models.Branch, models.Semester.branch_id == models.Branch.id)
        .filter(models.Subject.id == chat.subject_id)
        .first()
    )
    
    # Ensure subject belongs to user's university
    if (
        subject is None
        or subject.semester is None
        or subject.semester.branch is None
        or subject.semester.branch.university_id != current_user.university_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this chat/subject.",
        )
    
    # Get subject name from the database subject
    subject_name = subject.name if subject else "General"
    
    # --- RAG: fetch material chunks for this subject from DB ---
    question_lower = message_data.question.lower()
    # Extract words from question for better matching
    question_words = [w.strip() for w in question_lower.split() if len(w.strip()) > 2]  # Ignore very short words
    
    chunks = []
    if subject:
        chunks = (
            db.query(models.MaterialChunk)
            .join(models.MaterialDocument, models.MaterialChunk.document_id == models.MaterialDocument.id)
            .filter(models.MaterialDocument.subject_id == subject.id)
            .options(joinedload(models.MaterialChunk.document))
            .all()
        )
    
    relevant_chunks = []
    # First, try keyword-based matching
    for chunk in chunks:
        if chunk.keywords:
            keywords = [k.strip().lower() for k in chunk.keywords.split(",") if k.strip()]
            # Check if any keyword appears in question OR any question word appears in keywords
            keyword_match = any(kw and (kw in question_lower or any(qw in kw for qw in question_words)) for kw in keywords)
            if keyword_match:
                relevant_chunks.append(chunk)
                if len(relevant_chunks) >= 5:  # Increased limit
                    break
    
    # Fallback: if no keyword matches found, use first few chunks (up to 3)
    # This ensures we always have context if chunks exist for the subject
    # This includes chunks without keywords or when keyword matching fails
    if not relevant_chunks and chunks:
        relevant_chunks = chunks[:3]
    
    context_text = ""
    sources = []
    
    if relevant_chunks:
        context_text = "Reference material:\n"
        for chunk in relevant_chunks:
            doc = chunk.document
            context_text += f"Title: {doc.title}\n"
            if chunk.page_number:
                context_text += f"Page: {chunk.page_number}\n"
            if chunk.heading:
                context_text += f"Heading: {chunk.heading}\n"
            context_text += f"Content: {chunk.text}\n\n"
            sources.append({
                "type": "snippet",
                "title": doc.title,
                "page": chunk.page_number
            })
    
    system_prompt = f"""
You are a helpful AI tutor for a university student.

Subject: {subject_name}

You must answer ONLY using the reference material provided in the <context> section.
If the context does not contain enough information to answer properly, say:
"I don't have enough information in the provided notes to fully answer this. Please refer to your textbook or class notes."

Style requirements:
- Explain in a clear, exam-oriented way.
- Structure answers like 5–10 mark exam answers when appropriate.
- Do NOT introduce new definitions, formulas, or examples that are not supported by the context.
- You may reorganize and simplify the context, but do not add external knowledge.
"""
    
    if context_text:
        full_prompt = f"""{system_prompt}

<context>
{context_text}
</context>

Student question: {message_data.question}

Now answer using ONLY the information inside <context>."""
    else:
        full_prompt = f"""{system_prompt}

No context was found for this question.

Student question: {message_data.question}

Explain briefly, and mention that this answer is based on general knowledge, not on the uploaded study material."""
    
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
