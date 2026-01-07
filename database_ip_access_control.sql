-- ========================================
-- Table de contrôle d'accès IP pour Ivony
-- ========================================

-- Supprimer la table si elle existe (ATTENTION : perte de données)
-- DROP TABLE IF EXISTS ivony_ip_access_control CASCADE;

-- Créer la table de contrôle d'accès IP
CREATE TABLE IF NOT EXISTS ivony_ip_access_control (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_address inet UNIQUE NOT NULL,
    status text CHECK (status IN ('blacklist', 'whitelist')) NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE ivony_ip_access_control IS 'Gestion des adresses IP blacklistées ou whitelistées';
COMMENT ON COLUMN ivony_ip_access_control.id IS 'Identifiant unique de l''enregistrement';
COMMENT ON COLUMN ivony_ip_access_control.ip_address IS 'Adresse IP (format inet PostgreSQL)';
COMMENT ON COLUMN ivony_ip_access_control.status IS 'Statut de l''IP : blacklist ou whitelist';
COMMENT ON COLUMN ivony_ip_access_control.reason IS 'Raison de la blacklist/whitelist (optionnel)';
COMMENT ON COLUMN ivony_ip_access_control.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN ivony_ip_access_control.updated_at IS 'Date de dernière mise à jour';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ip_access_control_ip 
ON ivony_ip_access_control(ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_access_control_status 
ON ivony_ip_access_control(status);

CREATE INDEX IF NOT EXISTS idx_ip_access_control_updated_at 
ON ivony_ip_access_control(updated_at DESC);

-- ========================================
-- Fonction pour mettre à jour automatiquement updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_ip_access_control_updated_at ON ivony_ip_access_control;
CREATE TRIGGER update_ip_access_control_updated_at
    BEFORE UPDATE ON ivony_ip_access_control
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Données de test (optionnel - décommenter pour tester)
-- ========================================

-- INSERT INTO ivony_ip_access_control (ip_address, status, reason) VALUES
-- ('192.168.1.100', 'blacklist', 'Tentatives de connexion suspectes'),
-- ('10.0.0.50', 'whitelist', 'IP du bureau principal'),
-- ('203.0.113.0', 'blacklist', 'Scanning de ports détecté');

-- ========================================
-- Requêtes utiles
-- ========================================

-- Voir toutes les IPs gérées
-- SELECT * FROM ivony_ip_access_control ORDER BY updated_at DESC;

-- Compter les IPs par statut
-- SELECT status, COUNT(*) as count FROM ivony_ip_access_control GROUP BY status;

-- Voir les IPs blacklistées récemment
-- SELECT * FROM ivony_ip_access_control 
-- WHERE status = 'blacklist' 
-- ORDER BY updated_at DESC 
-- LIMIT 10;

-- Supprimer une IP de la liste
-- DELETE FROM ivony_ip_access_control WHERE ip_address = '192.168.1.100';

-- Changer le statut d'une IP
-- UPDATE ivony_ip_access_control 
-- SET status = 'whitelist', reason = 'Vérification effectuée' 
-- WHERE ip_address = '192.168.1.100';

-- ========================================
-- Politiques de sécurité Row Level Security (RLS)
-- Décommenter si vous utilisez RLS dans Supabase
-- ========================================

-- Activer RLS
-- ALTER TABLE ivony_ip_access_control ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs authentifiés peuvent tout voir
-- CREATE POLICY "Authenticated users can view IP access control"
-- ON ivony_ip_access_control
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- Politique : Les utilisateurs authentifiés peuvent tout modifier
-- CREATE POLICY "Authenticated users can modify IP access control"
-- ON ivony_ip_access_control
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ========================================
-- Vérification de l'installation
-- ========================================

-- Vérifier que la table existe
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name = 'ivony_ip_access_control';

-- Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ivony_ip_access_control'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'ivony_ip_access_control';

-- Vérifier les triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'ivony_ip_access_control';

-- ========================================
-- Fin du script
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Table ivony_ip_access_control créée avec succès';
    RAISE NOTICE '✅ Index créés';
    RAISE NOTICE '✅ Trigger updated_at configuré';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Prochaines étapes:';
    RAISE NOTICE '1. Vérifier les permissions (RLS si nécessaire)';
    RAISE NOTICE '2. Tester avec quelques IPs';
    RAISE NOTICE '3. Déployer l''interface utilisateur';
END $$;
