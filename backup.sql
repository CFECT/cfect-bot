CREATE TABLE IF NOT EXISTS Users (
    DiscordID TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    Sexo TEXT NOT NULL,
    NMec TEXT NOT NULL,
    Matricula TEXT NOT NULL,
    NomeDeFaina TEXT NOT NULL,
    FainaCompleta BOOLEAN NOT NULL,
    NumeroAluviao TEXT DEFAULT "?" NOT NULL
)

