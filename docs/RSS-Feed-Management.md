# RSS-Feed Management

## Übersicht

Das RSS-Feed Management System ermöglicht es Administratoren, RSS-Feeds für die News-Sektion des Dashboards zu verwalten. Ähnlich wie beim Event-Kalender können RSS-Feeds hinzugefügt, bearbeitet, aktiviert/deaktiviert und gelöscht werden.

## Funktionen

### RSS-Feed Verwaltung
- **Hinzufügen**: Neue RSS-Feeds mit URL, Titel und Beschreibung hinzufügen
- **Bearbeiten**: Bestehende RSS-Feeds modifizieren
- **Aktivieren/Deaktivieren**: RSS-Feeds temporär ein- oder ausschalten
- **Löschen**: RSS-Feeds permanent entfernen
- **Testen**: RSS-Feeds auf Gültigkeit und Inhalt prüfen

### Admin-Interface
- Zugriff über das Admin-Einstellungen Modal
- Tab "RSS Feeds" in den Admin-Einstellungen
- Button "RSS-Feeds verwalten" öffnet die Management-Oberfläche

## Technische Details

### API-Endpunkte
- `GET /api/admin/rss-feeds` - Alle RSS-Feeds abrufen
- `POST /api/admin/rss-feeds` - Neuen RSS-Feed erstellen
- `GET /api/admin/rss-feeds/[id]` - Spezifischen RSS-Feed abrufen
- `PUT /api/admin/rss-feeds/[id]` - RSS-Feed aktualisieren
- `PATCH /api/admin/rss-feeds/[id]` - RSS-Feed teilweise aktualisieren (z.B. Status)
- `DELETE /api/admin/rss-feeds/[id]` - RSS-Feed löschen

### Datenstruktur
```json
{
  "id": "unique-id",
  "url": "https://example.com/feed.xml",
  "title": "Feed Title",
  "description": "Optional description",
  "isActive": true,
  "lastChecked": "2024-01-01T00:00:00.000Z",
  "itemCount": 10,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Speicherung
- RSS-Feed-Konfigurationen werden in `/data/rss-feeds.json` gespeichert
- Automatische Fallback-Konfiguration falls keine Datei existiert
- Nur aktive RSS-Feeds werden für die News-API verwendet

## Verwendung

1. **Admin-Einstellungen öffnen**: Klicken Sie auf das Zahnrad-Symbol
2. **RSS Feeds Tab**: Wählen Sie den "RSS Feeds" Tab
3. **Verwaltung öffnen**: Klicken Sie auf "RSS-Feeds verwalten"
4. **RSS-Feed hinzufügen**: Klicken Sie auf "Neuen RSS-Feed hinzufügen"
5. **Daten eingeben**: URL, Titel und optional Beschreibung eingeben
6. **Speichern**: RSS-Feed wird automatisch getestet und gespeichert

## Features

### RSS-Feed Test
- Automatische Validierung der URL
- Analyse des Feed-Inhalts
- Empfehlungen für Optimierung
- Anzeige von Feed-Informationen (Titel, Beschreibung, Artikelanzahl, Sprache)

### Validierung
- URL-Format-Validierung
- Eindeutigkeit der URLs
- Pflichtfelder-Validierung

### Benutzerfreundlichkeit
- Intuitive Benutzeroberfläche
- Bestätigungsdialoge für kritische Aktionen
- Erfolgs- und Fehlermeldungen
- Responsive Design für verschiedene Bildschirmgrößen

## Integration

Die RSS-Feeds werden automatisch in die News-API integriert:
- Alle aktiven RSS-Feeds werden abgerufen
- Artikel werden nach Veröffentlichungsdatum sortiert
- Fallback-Mechanismus bei Fehlern
- Konfigurierbare Artikelanzahl pro Feed
