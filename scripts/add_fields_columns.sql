-- Verificar si las columnas existen y añadirlas si no
DO $$ 
BEGIN
    -- Datos catastrales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'provincia') THEN
        ALTER TABLE fields ADD COLUMN provincia TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'municipio') THEN
        ALTER TABLE fields ADD COLUMN municipio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'poligono') THEN
        ALTER TABLE fields ADD COLUMN poligono TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'parcela') THEN
        ALTER TABLE fields ADD COLUMN parcela TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'recinto') THEN
        ALTER TABLE fields ADD COLUMN recinto TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'referencia_catastral') THEN
        ALTER TABLE fields ADD COLUMN referencia_catastral TEXT;
    END IF;
    
    -- Datos geográficos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'latitud') THEN
        ALTER TABLE fields ADD COLUMN latitud DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'longitud') THEN
        ALTER TABLE fields ADD COLUMN longitud DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'altitud') THEN
        ALTER TABLE fields ADD COLUMN altitud DOUBLE PRECISION;
    END IF;
    
    -- Geometría GeoJSON
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'geometria') THEN
        ALTER TABLE fields ADD COLUMN geometria JSON;
    END IF;
END $$;