from typing import Optional

from pydantic import BaseModel

# --- Schemas de Acessórios ---
class AcessorioCreate(BaseModel):
    nome: str
    codigo_patrimonio: str

class AcessorioResponse(AcessorioCreate):
    id: int
    status: str

    class Config:
        from_attributes = True

# --- Schemas de Login ---
class LoginRequest(BaseModel):
    email: str
    senha: str

class LoginResponse(BaseModel):
    mensagem: str
    usuario_id: int
    nome: str
    perfil: str

# --- Schemas de Usuário ---
class UsuarioCreate(BaseModel):
    nome: str
    matricula: str
    email: str
    senha: str
    perfil: str 

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    perfil: str

    class Config:
        from_attributes = True

       
class RequerimentoCreate(BaseModel):
    solicitante: str
    equipamento: str
    justificativa: str

class RequerimentoUpdate(BaseModel):
    status: str
    motivo_rejeicao: Optional[str] = None

    
class ReservaCreate(BaseModel):
    solicitante: str
    equipamento: str
    data_reserva: str


class ReservaResponse(ReservaCreate):
    id: int
    devolvido: bool
    
    class Config:
        from_attributes = True 

