from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
# URL de conexão com o banco de dados PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Ttrs7654@127.0.0.1:5432/smartinventory"
#engine de criação
engine = create_engine(SQLALCHEMY_DATABASE_URL)
#sessão de criação
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#base de criação
Base = declarative_base()