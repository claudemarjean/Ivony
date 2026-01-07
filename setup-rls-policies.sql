-- ========================================
-- CONFIGURATION RLS POUR IVONY_CONSULTATION
-- ========================================
-- Ce fichier configure les politiques de sécurité au niveau des lignes
-- pour permettre le tracking des consultations

-- 1. Activer RLS sur la table (si ce n'est pas déjà fait)
ALTER TABLE ivony_consultation ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow public insert" ON ivony_consultation;
DROP POLICY IF EXISTS "Allow authenticated read" ON ivony_consultation;
DROP POLICY IF EXISTS "Allow authenticated update" ON ivony_consultation;

-- 3. Créer la politique d'insertion publique
-- Permet aux visiteurs anonymes ET authentifiés d'insérer des consultations
CREATE POLICY "Allow public insert" ON ivony_consultation
    FOR INSERT
    WITH CHECK (true);

-- 4. Créer la politique de lecture pour utilisateurs authentifiés
-- Seuls les utilisateurs connectés peuvent lire les données
CREATE POLICY "Allow authenticated read" ON ivony_consultation
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 5. Créer la politique de mise à jour (soft delete)
-- Seuls les utilisateurs authentifiés peuvent marquer comme supprimé
CREATE POLICY "Allow authenticated update" ON ivony_consultation
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier que les politiques sont bien créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ivony_consultation'
ORDER BY policyname;

-- Afficher un message de succès
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS configurées avec succès pour ivony_consultation';
END $$;
