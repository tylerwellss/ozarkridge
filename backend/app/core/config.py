from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="forbid",
    )

settings = Settings()  # pyright: ignore[reportCallIssue]
