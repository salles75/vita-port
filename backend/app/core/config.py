"""
Vita - Application Configuration
Configurações centralizadas da aplicação usando Pydantic Settings.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configurações da aplicação carregadas de variáveis de ambiente.
    Utiliza Pydantic Settings para validação e tipagem automática.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_prefix="VITA_",
    )

    # Application
    APP_NAME: str = "Vita API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Portal de Telemedicina e Monitoramento"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./vita.db"

    # Security
    SECRET_KEY: str = "vita-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4201",
        "http://localhost:3000",
    ]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


@lru_cache
def get_settings() -> Settings:
    """
    Retorna instância singleton das configurações.
    Utiliza cache para evitar múltiplas leituras do arquivo .env.
    """
    return Settings()


settings = get_settings()
