from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    matricula = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    perfil = Column(String)

class Acessorio(Base):
    __tablename__ = "acessorios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    codigo_patrimonio = Column(String, unique=True)
    status = Column(String, default="Disponível")

# --- Tabela de Salas ---
class Sala(Base):
    __tablename__ = "salas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    modalidade = Column(String)
    status = Column(String, default="Disponível")

class Requerimento(Base):
    __tablename__ = "requerimentos"
    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String)
    equipamento = Column(String)
    justificativa = Column(String)
    status = Column(String, default="Pendente")
    motivo_rejeicao = Column(String, nullable=True)

#  Tabela de Solicitações dos Alunos
class SolicitacaoAluno(Base):
    __tablename__ = "solicitacoes_alunos"
    id = Column(Integer, primary_key=True, index=True)
    aluno = Column(String)
    recurso_id_original = Column(String) 
    recurso_nome = Column(String)
    professor_nome = Column(String, nullable=True) 
    finalidade = Column(String)
    status = Column(String, default="Pendente")
    motivo_justificativa = Column(String, nullable=True) 

class Reserva(Base):
    __tablename__ = "reservas_oficial" 
    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String)
    equipamento = Column(String)
    data_reserva = Column(String)
    devolvido = Column(Boolean, default=False)
    recurso_id_original = Column(String, nullable=True)