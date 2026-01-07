# 💡 Exemples d'Utilisation Avancés - Gestion IP

## 📋 Table des matières
1. [Gestion Basique](#gestion-basique)
2. [Automation](#automation)
3. [Analyse et Reporting](#analyse-et-reporting)
4. [Import/Export](#importexport)
5. [Intégrations](#intégrations)

---

## 🎯 Gestion Basique

### Blacklister une IP manuellement

```javascript
// Via l'interface
// 1. Aller dans "Suivi vue"
// 2. Cliquer sur "Blacklist" pour l'IP 192.168.1.100
// 3. Entrer raison: "Scanning de ports détecté"
// 4. Confirmer

// Via console JavaScript (pour debug)
await supabaseClient
    .from('ivony_ip_access_control')
    .upsert({
        ip_address: '192.168.1.100',
        status: 'blacklist',
        reason: 'Scanning de ports détecté'
    }, { onConflict: 'ip_address' });
```

### Blacklister plusieurs IPs d'un coup

```javascript
// Liste d'IPs suspectes
const suspiciousIps = [
    { ip: '192.168.1.100', reason: 'Tentatives répétées' },
    { ip: '10.0.0.50', reason: 'Comportement anormal' },
    { ip: '203.0.113.25', reason: 'Scanning détecté' }
];

// Blacklist en masse
for (const item of suspiciousIps) {
    await supabaseClient
        .from('ivony_ip_access_control')
        .upsert({
            ip_address: item.ip,
            status: 'blacklist',
            reason: item.reason
        }, { onConflict: 'ip_address' });
}

console.log(`✅ ${suspiciousIps.length} IPs blacklistées`);
```

### Vérifier le statut d'une IP

```javascript
async function checkIpStatus(ipAddress) {
    const { data, error } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*')
        .eq('ip_address', ipAddress)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erreur:', error);
        return null;
    }
    
    if (!data) {
        return { status: 'neutral', reason: null };
    }
    
    return data;
}

// Utilisation
const status = await checkIpStatus('192.168.1.100');
console.log(`Status: ${status.status}, Raison: ${status.reason}`);
```

---

## 🤖 Automation

### Auto-blacklist après N tentatives échouées

```javascript
/**
 * Blacklister automatiquement une IP après 5 tentatives échouées
 */
async function autoBlacklistOnFailures() {
    // Récupérer les IPs avec tentatives échouées
    const { data: failedAttempts, error } = await supabaseClient
        .from('ivony_failed_login_attempts') // Table à créer
        .select('ip_address, COUNT(*) as attempts')
        .gte('attempted_at', new Date(Date.now() - 3600000).toISOString()) // 1h
        .group('ip_address')
        .having('COUNT(*) >= 5');
    
    if (error) {
        console.error('Erreur:', error);
        return;
    }
    
    // Blacklister chaque IP
    for (const record of failedAttempts) {
        await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: record.ip_address,
                status: 'blacklist',
                reason: `Auto-blacklist: ${record.attempts} tentatives échouées en 1h`
            }, { onConflict: 'ip_address' });
        
        console.log(`🚫 Auto-blacklist: ${record.ip_address}`);
    }
}

// Exécuter toutes les 5 minutes
setInterval(autoBlacklistOnFailures, 300000);
```

### Whitelist automatique des IPs de confiance

```javascript
/**
 * Whitelister automatiquement les IPs avec bonne réputation
 */
async function autoWhitelistTrustedIps() {
    const trustedIpRanges = [
        '10.0.0.0/8',      // Réseau interne
        '172.16.0.0/12',   // VPN entreprise
        '192.168.0.0/16'   // LAN
    ];
    
    for (const range of trustedIpRanges) {
        // Whitelister toutes les IPs de cette plage
        await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: range.split('/')[0], // IP de base
                status: 'whitelist',
                reason: 'Réseau de confiance'
            }, { onConflict: 'ip_address' });
    }
}
```

### Expiration automatique des blacklists temporaires

```javascript
/**
 * Supprimer les blacklists de plus de 30 jours
 */
async function cleanupOldBlacklists() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
    
    const { data, error } = await supabaseClient
        .from('ivony_ip_access_control')
        .delete()
        .eq('status', 'blacklist')
        .lt('created_at', thirtyDaysAgo);
    
    if (error) {
        console.error('Erreur nettoyage:', error);
        return;
    }
    
    console.log(`🧹 ${data?.length || 0} anciennes blacklists supprimées`);
}

// Exécuter chaque jour à minuit
setInterval(cleanupOldBlacklists, 86400000);
```

---

## 📊 Analyse et Reporting

### Statistiques complètes

```sql
-- Vue d'ensemble
SELECT 
    COUNT(*) FILTER (WHERE status = 'blacklist') as blacklisted,
    COUNT(*) FILTER (WHERE status = 'whitelist') as whitelisted,
    COUNT(*) as total
FROM ivony_ip_access_control;

-- IPs les plus actives (blacklistées)
SELECT 
    iac.ip_address,
    iac.reason,
    COUNT(c.id) as consultations_blocked,
    MAX(c.visited_at) as last_attempt
FROM ivony_ip_access_control iac
LEFT JOIN ivony_consultation c ON iac.ip_address = c.ip_address
WHERE iac.status = 'blacklist'
GROUP BY iac.ip_address, iac.reason
ORDER BY consultations_blocked DESC
LIMIT 20;

-- Évolution des blacklists par jour
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_blacklists
FROM ivony_ip_access_control
WHERE status = 'blacklist'
AND created_at >= now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Rapport hebdomadaire

```javascript
/**
 * Générer un rapport hebdomadaire des IPs
 */
async function generateWeeklyReport() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    
    // Nouvelles blacklists
    const { data: newBlacklists } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*')
        .eq('status', 'blacklist')
        .gte('created_at', sevenDaysAgo);
    
    // Nouvelles whitelists
    const { data: newWhitelists } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*')
        .eq('status', 'whitelist')
        .gte('created_at', sevenDaysAgo);
    
    const report = {
        period: 'Derniers 7 jours',
        newBlacklists: newBlacklists?.length || 0,
        newWhitelists: newWhitelists?.length || 0,
        topReasons: {}
    };
    
    // Compter les raisons
    newBlacklists?.forEach(item => {
        const reason = item.reason || 'Non spécifiée';
        report.topReasons[reason] = (report.topReasons[reason] || 0) + 1;
    });
    
    console.log('📊 Rapport hebdomadaire:', report);
    return report;
}
```

### Dashboard temps réel

```javascript
/**
 * Créer un dashboard avec les métriques clés
 */
async function getDashboardMetrics() {
    // Total IPs gérées
    const { count: totalManaged } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*', { count: 'exact', head: true });
    
    // IPs blacklistées
    const { count: blacklisted } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'blacklist');
    
    // IPs whitelistées
    const { count: whitelisted } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'whitelist');
    
    // Consultations bloquées aujourd'hui
    const { data: blockedToday } = await supabaseClient
        .from('ivony_consultation')
        .select('ip_address')
        .gte('visited_at', new Date().setHours(0, 0, 0, 0).toISOString())
        .in('ip_address', await getBlacklistedIps());
    
    return {
        totalManaged,
        blacklisted,
        whitelisted,
        blockedToday: blockedToday?.length || 0,
        protectionRate: totalManaged > 0 ? ((blacklisted / totalManaged) * 100).toFixed(1) : 0
    };
}

async function getBlacklistedIps() {
    const { data } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('ip_address')
        .eq('status', 'blacklist');
    return data?.map(r => r.ip_address) || [];
}
```

---

## 📁 Import/Export

### Export CSV des IPs blacklistées

```javascript
/**
 * Exporter toutes les IPs blacklistées en CSV
 */
async function exportBlacklistToCSV() {
    const { data, error } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('*')
        .eq('status', 'blacklist')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erreur export:', error);
        return;
    }
    
    // Créer CSV
    const headers = ['IP Address', 'Reason', 'Created At', 'Updated At'];
    const rows = data.map(item => [
        item.ip_address,
        item.reason || '',
        new Date(item.created_at).toISOString(),
        new Date(item.updated_at).toISOString()
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacklist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Export réussi: ${data.length} IPs`);
}
```

### Import CSV de blacklist

```javascript
/**
 * Importer une liste d'IPs depuis un CSV
 * Format: ip_address,reason
 */
async function importBlacklistFromCSV(csvContent) {
    const lines = csvContent.split('\n').slice(1); // Skip header
    const records = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        const [ip, reason] = line.split(',').map(s => s.replace(/"/g, '').trim());
        
        if (!ip) continue;
        
        records.push({
            ip_address: ip,
            status: 'blacklist',
            reason: reason || 'Imported from CSV'
        });
    }
    
    // Insert en masse
    const { data, error } = await supabaseClient
        .from('ivony_ip_access_control')
        .upsert(records, { onConflict: 'ip_address' });
    
    if (error) {
        console.error('Erreur import:', error);
        return;
    }
    
    console.log(`✅ Import réussi: ${records.length} IPs`);
}

// Utilisation
const csvFile = `ip_address,reason
192.168.1.100,"Scanning détecté"
10.0.0.50,"Tentatives répétées"
203.0.113.25,"Comportement suspect"`;

await importBlacklistFromCSV(csvFile);
```

### Synchronisation avec une liste externe

```javascript
/**
 * Synchroniser avec une liste publique de bad IPs
 */
async function syncWithExternalBlacklist() {
    // Exemple: liste publique de bad IPs
    const response = await fetch('https://example.com/bad-ips.txt');
    const badIps = await response.text();
    const ipList = badIps.split('\n').filter(ip => ip.trim());
    
    console.log(`📥 ${ipList.length} IPs dans la liste externe`);
    
    // Blacklister chaque IP
    for (const ip of ipList) {
        await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: ip.trim(),
                status: 'blacklist',
                reason: 'Synchronisation liste externe'
            }, { onConflict: 'ip_address' });
    }
    
    console.log(`✅ Synchronisation terminée`);
}
```

---

## 🔗 Intégrations

### Webhook notification sur nouvelle blacklist

```javascript
/**
 * Envoyer une notification webhook quand une IP est blacklistée
 */
async function sendBlacklistNotification(ipAddress, reason) {
    const webhookUrl = 'https://your-webhook-endpoint.com/blacklist';
    
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'ip_blacklisted',
            ip_address: ipAddress,
            reason: reason,
            timestamp: new Date().toISOString()
        })
    });
}

// Dans manageIpAccess()
if (action === 'blacklist') {
    await sendBlacklistNotification(ip, reason);
}
```

### Intégration avec service de géolocalisation

```javascript
/**
 * Enrichir les données IP avec géolocalisation
 */
async function enrichIpWithGeo(ipAddress) {
    // Utiliser un service comme ipapi.co
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const geoData = await response.json();
    
    return {
        country: geoData.country_name,
        city: geoData.city,
        region: geoData.region,
        org: geoData.org,
        threat_level: geoData.threat // Si disponible
    };
}

// Blacklist avec enrichissement
async function blacklistWithGeo(ipAddress, reason) {
    const geo = await enrichIpWithGeo(ipAddress);
    
    await supabaseClient
        .from('ivony_ip_access_control')
        .upsert({
            ip_address: ipAddress,
            status: 'blacklist',
            reason: `${reason} | ${geo.country} - ${geo.org}`
        }, { onConflict: 'ip_address' });
    
    console.log(`🚫 Blacklist: ${ipAddress} (${geo.country})`);
}
```

### Intégration avec Cloudflare

```javascript
/**
 * Synchroniser blacklist avec Cloudflare Firewall Rules
 */
async function syncToCloudflare() {
    const { data: blacklisted } = await supabaseClient
        .from('ivony_ip_access_control')
        .select('ip_address')
        .eq('status', 'blacklist');
    
    const ipList = blacklisted.map(r => r.ip_address);
    
    // API Cloudflare (exemple simplifié)
    const cfApiToken = 'your-cloudflare-api-token';
    const zoneId = 'your-zone-id';
    
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/access_rules/rules`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mode: 'block',
            configuration: {
                target: 'ip',
                value: ipList.join(',')
            },
            notes: 'Synchronized from Ivony blacklist'
        })
    });
    
    console.log(`✅ ${ipList.length} IPs synchronisées avec Cloudflare`);
}
```

---

## 🎓 Cas d'usage avancés

### Blacklist progressive (3 strikes)

```javascript
/**
 * Système de 3 strikes avant blacklist définitive
 */
async function handleSuspiciousActivity(ipAddress) {
    // Table pour tracker les strikes
    const { data: strikes } = await supabaseClient
        .from('ivony_ip_strikes')
        .select('count')
        .eq('ip_address', ipAddress)
        .single();
    
    const currentStrikes = (strikes?.count || 0) + 1;
    
    if (currentStrikes >= 3) {
        // Blacklist définitive
        await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: ipAddress,
                status: 'blacklist',
                reason: `Blacklist après ${currentStrikes} strikes`
            }, { onConflict: 'ip_address' });
        
        console.log(`🚫 Blacklist définitive: ${ipAddress}`);
    } else {
        // Incrémenter le compteur
        await supabaseClient
            .from('ivony_ip_strikes')
            .upsert({
                ip_address: ipAddress,
                count: currentStrikes
            }, { onConflict: 'ip_address' });
        
        console.log(`⚠️ Strike ${currentStrikes}/3 pour ${ipAddress}`);
    }
}
```

### Whitelist VIP automatique

```javascript
/**
 * Whitelister automatiquement les utilisateurs premium
 */
async function whitelistPremiumUsers() {
    const { data: premiumUsers } = await supabaseClient
        .from('ivony_users')
        .select('last_ip_address')
        .eq('subscription_tier', 'premium')
        .not('last_ip_address', 'is', null);
    
    for (const user of premiumUsers) {
        await supabaseClient
            .from('ivony_ip_access_control')
            .upsert({
                ip_address: user.last_ip_address,
                status: 'whitelist',
                reason: 'Utilisateur Premium'
            }, { onConflict: 'ip_address' });
    }
    
    console.log(`✅ ${premiumUsers.length} IPs premium whitelistées`);
}
```

---

**Dernière mise à jour** : 7 janvier 2026  
**Version** : 1.0.0  
**Auteur** : Assistant IA
