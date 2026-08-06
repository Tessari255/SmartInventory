from typing import Optional
from pydantic import BaseModel, ConfigDict

# --- Schemas de Acessórios ---
class AcessorioCreate(BaseModel):
    nome: str
    codigo_patrimonio: str

class AcessorioResponse(AcessorioCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str

# --- Schemas de Salas (NOVO) ---
class SalaCreate(BaseModel):
    nome: str
    modalidade: str

class SalaResponse(SalaCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str

# --- Schemas de Login ---
class LoginRequest(BaseModel):
    email: str
    senha: str

class LoginResponse(BaseModel):
    mensagem: str
    usuario_id: int
    nome: str
    perfil: str
    access_token: Optional[str] = None
    token_type: Optional[str] = None

# --- Schemas de Usuário ---
class UsuarioCreate(BaseModel):
    nome: str
    matricula: str
    email: str
    senha: str
    perfil: str 

class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    matricula: str 
    email: str
    perfil: str

# --- Schemas de Requerimentos  ---
class RequerimentoCreate(BaseModel):
    solicitante: str
    equipamento: str  
    justificativa: str

class RequerimentoUpdate(BaseModel):
    status: str
    motivo_rejeicao: Optional[str] = None

# --- Schemas de Solicitações  ---
class SolicitacaoAlunoCreate(BaseModel):
    aluno: str
    recurso_id: str
    professor_id: Optional[int] = None
    finalidade: str

class AvaliacaoAluno(BaseModel):
    status: str
    motivo: str

# --- Schemas de Reservas ---
class ReservaCreate(BaseModel):
    solicitante: str
    equipamento: str
    data_reserva: str

class ReservaResponse(ReservaCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    devolvido: bool
    recurso_id_original: Optional[str] = None 