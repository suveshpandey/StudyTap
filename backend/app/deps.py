from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        
        if payload is None:
            raise credentials_exception
        
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        # Convert string back to int (python-jose requires sub to be string)
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise credentials_exception
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Authentication error: {type(e).__name__}: {e}")
        raise credentials_exception
