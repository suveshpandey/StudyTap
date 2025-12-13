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
from app.kendra_client import query_kendra, format_kendra_results_for_gemini, KENDRA_ENABLED

router = APIRouter()


@router.post("/start", response_model=schemas.ChatOut)
async def start_chat(
    chat_data: schemas.ChatCreate,
    current_user: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Start a new chat session (students only).
    Creates a Chat row for the current student.
    - If subject_id is provided: Creates a subject-specific chat
    - If subject_id is None: Creates a branch-level chat (all materials in student's branch)
    Validates that subject belongs to student's university (if subject_id provided).
    get_current_student ensures student is active and their university is active.
    """
    
    subject = None
    subject_name = None
    
    # If subject_id is provided, validate it
    if chat_data.subject_id:
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
        subject_name = subject.name
    else:
        # Branch-level chat: validate student has a branch
        if not current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to any branch. Please contact your administrator."
            )
        subject_name = "Branch-wide Chat"

    # Always start with a generic title; first user question will override it
    new_chat = models.Chat(
        student_id=current_user.id,
        subject_id=chat_data.subject_id,  # Can be None for branch-level chats
        title="New chat" if chat_data.subject_id else "Branch Chat"
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return schemas.ChatOut(
        id=new_chat.id,
        title=new_chat.title,
        subject_name=subject_name,
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
    Handles both subject-specific chats and branch-level chats (where subject_id is NULL).
    get_current_student ensures student is active and their university is active.
    """
    q = (
        db.query(models.Chat)
        .outerjoin(models.Subject, models.Chat.subject_id == models.Subject.id)
        .filter(models.Chat.student_id == current_user.id)
        .order_by(models.Chat.created_at.desc())
    )

    results = []
    for chat in q.all():
        subject_name = None
        if chat.subject_id:
            # Subject-specific chat
            subject = db.query(models.Subject).filter(models.Subject.id == chat.subject_id).first()
            subject_name = subject.name if subject else None
        else:
            # Branch-level chat
            subject_name = "Branch-wide Chat"
        
        results.append(
            schemas.ChatOut(
                id=chat.id,
                title=chat.title,
                subject_name=subject_name,
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
    
    # Handle both subject-specific and branch-level chats
    subject = None
    branch = None
    subject_name = None
    university_id = current_user.university_id
    
    if chat.subject_id:
        # Subject-specific chat: Load and validate subject
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
            or subject.semester.branch.university_id != university_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this chat/subject.",
            )
        subject_name = subject.name if subject else "General"
    else:
        # Branch-level chat: Validate student has a branch
        if not current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to any branch. Please contact your administrator."
            )
        
        # Load and validate branch belongs to student's university
        branch = (
            db.query(models.Branch)
            .filter(
                models.Branch.id == current_user.branch_id,
                models.Branch.university_id == university_id
            )
            .first()
        )
        
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch not found or does not belong to your university."
            )
        subject_name = "Branch-wide Chat"
    
    # --- RAG: Query AWS Kendra for relevant chunks from S3 ---
    context_text = ""
    sources = []
    kendra_results = []
    
    # Try to use Kendra if configured
    if KENDRA_ENABLED:
        try:
            # Query Kendra with question, filtered by university and subject/branch
            if subject:
                # Subject-specific query
                kendra_results = query_kendra(
                    question=message_data.question,
                    university_id=university_id,
                    subject_id=subject.id,
                    max_results=5
                )
            elif branch:
                # Branch-level query
                kendra_results = query_kendra(
                    question=message_data.question,
                    university_id=university_id,
                    branch_id=branch.id,
                    max_results=5
                )
            
            # Debug logging (temporary)
            print(f"[Kendra Debug] Query: '{message_data.question}'")
            print(f"[Kendra Debug] University ID: {university_id}, Subject ID: {subject.id if subject else None}, Branch ID: {branch.id if branch else None}")
            print(f"[Kendra Debug] Results count: {len(kendra_results) if kendra_results else 0}")
            if kendra_results:
                for i, r in enumerate(kendra_results):
                    print(f"[Kendra Debug] Result {i+1}: type={r.get('type')}, excerpt_length={len(r.get('excerpt', ''))}, relevance={r.get('relevance_score')}")
            
            if kendra_results:
                # Format Kendra results for Gemini
                context_text = format_kendra_results_for_gemini(kendra_results)
                
                # Build sources list from Kendra results
                # Look up document titles from database using S3 keys
                for result in kendra_results:
                    s3_key = result.get("s3_key", "")
                    document_title = result.get("document_title", "Unknown")
                    page_number = result.get("page_number")
                    
                    # Try to get the actual document title from database
                    if s3_key:
                        material_doc = (
                            db.query(models.MaterialDocument)
                            .filter(models.MaterialDocument.s3_key == s3_key)
                            .first()
                        )
                        if material_doc:
                            document_title = material_doc.title
                    
                    # Build source object with page number if available
                    source_obj = {
                        "type": "kendra",
                        "title": document_title,
                        "uri": result.get("document_uri", ""),
                        "relevance": result.get("relevance_score", "MEDIUM")
                    }
                    
                    # Add page number if available
                    if page_number is not None:
                        source_obj["page"] = int(page_number) if isinstance(page_number, (int, float, str)) and str(page_number).isdigit() else page_number
                    
                    sources.append(source_obj)
        except Exception as e:
            # Log error but continue with fallback
            print(f"Error querying Kendra: {str(e)}")
            # Fallback to database chunks if Kendra fails
            kendra_results = []
    
    # Fallback: Use database chunks if Kendra is not enabled or failed
    if not kendra_results and not context_text:
        question_lower = message_data.question.lower()
        question_words = [w.strip() for w in question_lower.split() if len(w.strip()) > 2]
        
        chunks = []
        if subject:
            # Subject-specific fallback
            chunks = (
                db.query(models.MaterialChunk)
                .join(models.MaterialDocument, models.MaterialChunk.document_id == models.MaterialDocument.id)
                .filter(models.MaterialDocument.subject_id == subject.id)
                .options(joinedload(models.MaterialChunk.document))
                .all()
            )
        elif branch:
            # Branch-level fallback: get chunks from all subjects in the branch
            chunks = (
                db.query(models.MaterialChunk)
                .join(models.MaterialDocument, models.MaterialChunk.document_id == models.MaterialDocument.id)
                .join(models.Subject, models.MaterialDocument.subject_id == models.Subject.id)
                .join(models.Semester, models.Subject.semester_id == models.Semester.id)
                .filter(models.Semester.branch_id == branch.id)
                .options(joinedload(models.MaterialChunk.document))
                .all()
            )
        
        relevant_chunks = []
        # Try keyword-based matching
        for chunk in chunks:
            if chunk.keywords:
                keywords = [k.strip().lower() for k in chunk.keywords.split(",") if k.strip()]
                keyword_match = any(kw and (kw in question_lower or any(qw in kw for qw in question_words)) for kw in keywords)
                if keyword_match:
                    relevant_chunks.append(chunk)
                    if len(relevant_chunks) >= 5:
                        break
        
        # Fallback: use first few chunks if no keyword matches
        if not relevant_chunks and chunks:
            relevant_chunks = chunks[:3]
        
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
    # Check if chat needs a title update (default titles)
    default_titles = ("New chat", "Branch Chat", None)
    if chat.title in default_titles:
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
    
    # Check if Gemini indicates insufficient information
    # If so, don't show sources as they weren't useful for answering
    insufficient_info_phrases = [
        "i don't have enough information",
        "don't have enough information",
        "not enough information",
        "insufficient information",
        "please refer to your textbook",
        "refer to your textbook",
        "refer to your class notes",
        "please refer to your class notes"
    ]
    
    answer_lower = answer_text.lower()
    has_insufficient_info = any(phrase in answer_lower for phrase in insufficient_info_phrases)
    
    # Clear sources if Gemini says there's insufficient information
    final_sources = []
    if not has_insufficient_info:
        final_sources = sources
    
    # Insert bot message
    bot_message = models.ChatMessage(
        chat_id=chat_id,
        sender="BOT",
        message=answer_text,
        sources=final_sources if final_sources else None
    )
    db.add(bot_message)
    db.commit()
    db.refresh(bot_message)
    
    # Return response with answer, sources, and updated title if applicable
    return {
        "answer": answer_text,
        "sources": final_sources,
        "chat_title": updated_title
    }
