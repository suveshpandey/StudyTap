from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token

router = APIRouter()


@router.post("/signup", response_model=schemas.TokenResponse)
async def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}. Please check your DATABASE_URL in .env file and ensure MySQL is running."
        )
    
    try:
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = models.User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token (sub must be a string for python-jose)
        access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(
                id=new_user.id,
                name=new_user.name,
                email=new_user.email,
                role=new_user.role
            )
        }
    except OperationalError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}. Please check your DATABASE_URL in .env file and ensure MySQL is running."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the user: {str(e)}"
        )


@router.post("/login", response_model=schemas.TokenResponse)
async def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == credentials.email).first()
        
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token (sub must be a string for python-jose)
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role
            )
        }
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}. Please check your DATABASE_URL in .env file and ensure MySQL is running."
        )

