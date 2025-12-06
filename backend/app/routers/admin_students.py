# -----------------------------------------------------------------------------
# File: admin_students.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Admin router for managing students via CSV upload
# -----------------------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
import openpyxl
import random
import string
import asyncio
from app.database import get_db
from app import models, schemas
from app.deps import get_current_university_admin
from app.auth import get_password_hash
from app.email_service import send_bulk_student_credentials_emails

router = APIRouter()


@router.post("/students/upload-csv", response_model=schemas.StudentBulkCreateResponse)
async def upload_students_csv(
    file: UploadFile = File(...),
    branch_id: int = Form(...),
    batch_year: int = Form(...),
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Upload an Excel (.xlsx, .xls) or CSV file to create multiple students at once.
    File format: name, email (only these two columns required)
    All students will be assigned to the specified branch and batch_year.
    Passwords will be auto-generated.
    """
    # Get university_id directly from current_admin (it's now a UniversityAdmin object)
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Validate branch belongs to admin's university
    branch = db.query(models.Branch).filter(
        models.Branch.id == branch_id,
        models.Branch.university_id == university_id
    ).first()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found in your university"
        )
    
    # Validate batch_year (should be a reasonable year, e.g., 2020-2100)
    if batch_year < 2020 or batch_year > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid batch year. Please provide a year between 2020 and 2100."
        )
    
    # Validate file type
    file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel (.xlsx, .xls) or CSV (.csv) file"
        )
    
    try:
        contents = await file.read()
        rows = []
        
        # Parse Excel file
        if file_extension in ['xlsx', 'xls']:
            workbook = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
            sheet = workbook.active
            
            # Get header row
            header_row = []
            for cell in sheet[1]:
                header_row.append(str(cell.value).lower().strip() if cell.value else '')
            
            # Find column indices (0-based)
            name_col_idx = None
            email_col_idx = None
            for idx, header in enumerate(header_row):
                if header == 'name':
                    name_col_idx = idx
                elif header == 'email':
                    email_col_idx = idx
            
            if name_col_idx is None or email_col_idx is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Excel file must have 'name' and 'email' columns in the first row"
                )
            
            # Read data rows
            for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                name_val = row[name_col_idx] if name_col_idx < len(row) else None
                email_val = row[email_col_idx] if email_col_idx < len(row) else None
                
                if not name_val or not email_val:
                    continue  # Skip empty rows
                
                rows.append({
                    'row_num': row_num,
                    'name': str(name_val).strip() if name_val else '',
                    'email': str(email_val).strip().lower() if email_val else ''
                })
        
        # Parse CSV file
        else:
            csv_content = contents.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            for row_num, row in enumerate(csv_reader, start=2):
                rows.append({
                    'row_num': row_num,
                    'name': row.get('name', '').strip(),
                    'email': row.get('email', '').strip().lower()
                })
        
        # Sort rows by name before processing
        rows.sort(key=lambda x: x['name'].lower())
        
        created_students = []
        errors = []
        
        for row_data in rows:
            row_num = row_data['row_num']
            name = row_data['name']
            email = row_data['email']
            
            # Use a savepoint for each row so we can rollback just this row on error
            savepoint = db.begin_nested()
            try:
                # Validate required fields
                if not name or not email:
                    errors.append(f"Row {row_num}: Missing required fields (name, email)")
                    continue
                
                # Validate email format
                if '@' not in email:
                    errors.append(f"Row {row_num}: Invalid email format: {email}")
                    continue
                
                # Check if email already exists in role tables
                existing_student = db.query(models.Student).filter(
                    models.Student.email == email
                ).first()
                existing_admin = db.query(models.UniversityAdmin).filter(
                    models.UniversityAdmin.email == email
                ).first()
                existing_master = db.query(models.MasterAdmin).filter(
                    models.MasterAdmin.email == email
                ).first()
                
                if existing_student or existing_admin or existing_master:
                    errors.append(f"Row {row_num}: Email {email} already exists")
                    savepoint.rollback()  # Rollback this row's savepoint
                    continue
                
                
                # Generate random 8-character alphanumeric password
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                
                # Hash the password before storing
                hashed_password = get_password_hash(password)
                
                # Create Student entry with branch_id and batch_year
                student = models.Student(
                    name=name,
                    email=email,
                    password_hash=hashed_password,
                    university_id=university_id,
                    branch_id=branch_id,
                    batch_year=batch_year,
                    is_active=True,
                )
                db.add(student)
                db.flush()  # Get student.id
                
                
                created_students.append({
                    'name': name,
                    'email': email,
                    'password': password,  # Return plain password for sharing
                })
                
                # Commit this row's savepoint
                savepoint.commit()
                
            except Exception as e:
                # Rollback just this row's savepoint
                savepoint.rollback()
                errors.append(f"Row {row_num}: Error processing - {str(e)}")
                continue
        
        # Commit all successful creations
        if created_students:
            db.commit()
            
            # Send credentials emails to all successfully created students
            try:
                email_results = await send_bulk_student_credentials_emails(created_students)
                # Log email results (you can add this to errors if needed)
                if email_results['failed']:
                    for failed_email in email_results['failed']:
                        errors.append(f"Email sending failed for {failed_email['email']}: {failed_email.get('error', 'Unknown error')}")
            except Exception as e:
                # Don't fail the entire request if email sending fails
                # Just log the error
                print(f"Error sending emails: {str(e)}")
                errors.append(f"Warning: Some emails could not be sent. Students were created successfully.")
        
        return {
            'success': len(created_students),
            'errors': errors,
            'students': created_students
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


@router.get("/students", response_model=List[schemas.StudentResponse])
async def get_all_students(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    batch_year: Optional[int] = Query(None, description="Filter by batch year"),
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Get students for the university admin's university.
    Optional filters: branch_id and batch_year.
    """
    # Get university_id directly from current_admin (it's now a UniversityAdmin object)
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    # Build query
    query = db.query(models.Student).filter(models.Student.university_id == university_id)
    
    # Apply filters
    if branch_id is not None:
        # Validate branch belongs to admin's university
        branch = db.query(models.Branch).filter(
            models.Branch.id == branch_id,
            models.Branch.university_id == university_id
        ).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branch not found in your university"
            )
        query = query.filter(models.Student.branch_id == branch_id)
    
    if batch_year is not None:
        query = query.filter(models.Student.batch_year == batch_year)
    
    students = query.order_by(models.Student.name).all()
    return students


@router.post("/students/{student_id}/activate", response_model=schemas.StudentResponse)
async def activate_student(
    student_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Activate a student account (university admin only).
    Only allows activation if student belongs to admin's university.
    """
    # Get university_id directly from current_admin (it's now a UniversityAdmin object)
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id,
            models.Student.university_id == university_id
        )
        .first()
    )
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found for your university"
        )
    
    student.is_active = True
    db.commit()
    db.refresh(student)
    return student


@router.post("/students/{student_id}/deactivate", response_model=schemas.StudentResponse)
async def deactivate_student(
    student_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Deactivate a student account (university admin only).
    Only allows deactivation if student belongs to admin's university.
    """
    # Get university_id directly from current_admin (it's now a UniversityAdmin object)
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id,
            models.Student.university_id == university_id
        )
        .first()
    )
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found for your university"
        )
    
    student.is_active = False
    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_admin: models.UniversityAdmin = Depends(get_current_university_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a student (university admin only).
    Only allows deletion if student belongs to admin's university.
    """
    # Get university_id directly from current_admin (it's now a UniversityAdmin object)
    university_id = current_admin.university_id
    
    if university_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University admin is not assigned to any university.",
        )
    
    student = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id,
            models.Student.university_id == university_id
        )
        .first()
    )
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found for your university"
        )
    
    db.delete(student)
    db.commit()
    
    return None

