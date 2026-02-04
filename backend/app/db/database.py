"""
Vita - Database Configuration
Configuração do SQLAlchemy assíncrono com SQLite.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Engine assíncrono
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Session factory assíncrona
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class para todos os modelos SQLAlchemy."""
    pass


async def get_db() -> AsyncSession:
    """
    Dependency que fornece uma sessão de banco de dados.
    Garante que a sessão seja fechada após o uso.

    Yields:
        AsyncSession: Sessão do banco de dados
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas.
    Deve ser chamado na inicialização da aplicação.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
