-- Bookly - modelo relacional objetivo (SQLite 3)
-- La aplicacion web de demostracion no ejecuta este esquema: persiste en localStorage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Autores (
    AutorId INTEGER PRIMARY KEY,
    Nombre TEXT NOT NULL CHECK (length(trim(Nombre)) BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS Generos (
    GeneroId INTEGER PRIMARY KEY,
    Nombre TEXT NOT NULL UNIQUE CHECK (length(trim(Nombre)) BETWEEN 1 AND 60)
);

CREATE TABLE IF NOT EXISTS Libros (
    LibroId INTEGER PRIMARY KEY,
    Titulo TEXT NOT NULL CHECK (length(trim(Titulo)) BETWEEN 1 AND 180),
    ISBN TEXT NOT NULL UNIQUE
        CHECK (ISBN = replace(replace(ISBN, '-', ''), ' ', ''))
        CHECK (length(ISBN) IN (10, 13))
        CHECK (ISBN NOT GLOB '*[^0-9Xx]*'),
    Editorial TEXT NOT NULL CHECK (length(trim(Editorial)) BETWEEN 1 AND 100),
    AnioPublicacion INTEGER NOT NULL CHECK (AnioPublicacion BETWEEN 1000 AND 2100),
    CantidadEjemplares INTEGER NOT NULL CHECK (CantidadEjemplares > 0),
    AutorId INTEGER NOT NULL,
    GeneroId INTEGER NOT NULL,
    FOREIGN KEY (AutorId) REFERENCES Autores(AutorId) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (GeneroId) REFERENCES Generos(GeneroId) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Socios (
    SocioId INTEGER PRIMARY KEY,
    Nombre TEXT NOT NULL CHECK (length(trim(Nombre)) BETWEEN 1 AND 60),
    Apellido TEXT NOT NULL CHECK (length(trim(Apellido)) BETWEEN 1 AND 60),
    DNI TEXT NOT NULL UNIQUE CHECK (DNI = trim(DNI) AND length(DNI) BETWEEN 7 AND 12),
    Telefono TEXT NOT NULL CHECK (length(trim(Telefono)) BETWEEN 1 AND 30),
    Correo TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (Correo = trim(Correo) AND length(Correo) BETWEEN 3 AND 120),
    FechaAlta TEXT NOT NULL CHECK (date(FechaAlta) IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS Prestamos (
    PrestamoId INTEGER PRIMARY KEY,
    SocioId INTEGER NOT NULL,
    FechaPrestamo TEXT NOT NULL CHECK (date(FechaPrestamo) IS NOT NULL),
    FechaPrevistaDevolucion TEXT NOT NULL CHECK (date(FechaPrevistaDevolucion) IS NOT NULL),
    CHECK (FechaPrevistaDevolucion >= FechaPrestamo),
    FOREIGN KEY (SocioId) REFERENCES Socios(SocioId) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS DetallesPrestamo (
    DetallePrestamoId INTEGER PRIMARY KEY,
    PrestamoId INTEGER NOT NULL,
    LibroId INTEGER NOT NULL,
    FechaDevolucion TEXT CHECK (FechaDevolucion IS NULL OR date(FechaDevolucion) IS NOT NULL),
    FOREIGN KEY (PrestamoId) REFERENCES Prestamos(PrestamoId) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (LibroId) REFERENCES Libros(LibroId) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS IX_Libros_Titulo ON Libros(Titulo);
CREATE INDEX IF NOT EXISTS IX_Libros_AutorId ON Libros(AutorId);
CREATE INDEX IF NOT EXISTS IX_Libros_GeneroId ON Libros(GeneroId);
CREATE INDEX IF NOT EXISTS IX_Prestamos_Socio_Fecha ON Prestamos(SocioId, FechaPrestamo);
CREATE INDEX IF NOT EXISTS IX_DetallesPrestamo_Libro ON DetallesPrestamo(LibroId);

CREATE TRIGGER IF NOT EXISTS TR_DetallesPrestamo_Disponibilidad_Insert
BEFORE INSERT ON DetallesPrestamo
WHEN NEW.FechaDevolucion IS NULL
BEGIN
    SELECT CASE
        WHEN (
            SELECT COUNT(*)
            FROM DetallesPrestamo AS dp
            WHERE dp.LibroId = NEW.LibroId AND dp.FechaDevolucion IS NULL
        ) >= (
            SELECT CantidadEjemplares FROM Libros WHERE LibroId = NEW.LibroId
        )
        THEN RAISE(ABORT, 'No hay ejemplares disponibles para prestar.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS TR_DetallesPrestamo_Disponibilidad_Update
BEFORE UPDATE OF LibroId, FechaDevolucion ON DetallesPrestamo
WHEN NEW.FechaDevolucion IS NULL
BEGIN
    SELECT CASE
        WHEN (
            SELECT COUNT(*)
            FROM DetallesPrestamo AS dp
            WHERE dp.LibroId = NEW.LibroId
              AND dp.FechaDevolucion IS NULL
              AND dp.DetallePrestamoId <> OLD.DetallePrestamoId
        ) >= (
            SELECT CantidadEjemplares FROM Libros WHERE LibroId = NEW.LibroId
        )
        THEN RAISE(ABORT, 'No hay ejemplares disponibles para prestar.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS TR_Libros_Cantidad_NoMenorPrestados
BEFORE UPDATE OF CantidadEjemplares ON Libros
BEGIN
    SELECT CASE
        WHEN NEW.CantidadEjemplares < (
            SELECT COUNT(*)
            FROM DetallesPrestamo AS dp
            WHERE dp.LibroId = OLD.LibroId AND dp.FechaDevolucion IS NULL
        )
        THEN RAISE(ABORT, 'La cantidad no puede ser menor que los ejemplares prestados.')
    END;
END;

-- La disponibilidad se deriva del catalogo y de los detalles que aun no se devolvieron.
CREATE VIEW IF NOT EXISTS DisponibilidadLibros AS
SELECT
    l.LibroId,
    l.Titulo,
    l.CantidadEjemplares,
    l.CantidadEjemplares - COALESCE(SUM(
        CASE WHEN p.PrestamoId IS NOT NULL AND dp.FechaDevolucion IS NULL THEN 1 ELSE 0 END
    ), 0) AS EjemplaresDisponibles
FROM Libros AS l
LEFT JOIN DetallesPrestamo AS dp ON dp.LibroId = l.LibroId
LEFT JOIN Prestamos AS p
    ON p.PrestamoId = dp.PrestamoId
   AND dp.FechaDevolucion IS NULL
GROUP BY l.LibroId, l.Titulo, l.CantidadEjemplares;
