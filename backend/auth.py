import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from models import Usuario

SECRET_KEY = "clave_secreta_tp_final_isfd_san_roque_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hashear_password(password: str) -> str:
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}:{pw_hash.hex()}"

def verificar_password(password_plano: str, password_guardado: str) -> bool:
    try:
        salt_hex, hash_hex = password_guardado.split(":")
        salt = bytes.fromhex(salt_hex)
        hash_esperado = bytes.fromhex(hash_hex)
        hash_actual = hashlib.pbkdf2_hmac("sha256", password_plano.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(hash_actual, hash_esperado)
    except Exception:
        return False

def crear_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def obtener_usuario_actual(token: str = Depends(oauth2_scheme)) -> Usuario:
    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credenciales_exception
    except jwt.PyJWTError:
        raise credenciales_exception

    usuario = Usuario.get_or_none((Usuario.id == int(user_id)) & (Usuario.activo == True))
    if usuario is None:
        raise credenciales_exception
    return usuario

def requerir_roles(roles_permitidos: List[str]):
    def verificador_rol(usuario_actual: Usuario = Depends(obtener_usuario_actual)) -> Usuario:
        if usuario_actual.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de estos roles: {', '.join(roles_permitidos)}"
            )
        return usuario_actual
    return verificador_rol