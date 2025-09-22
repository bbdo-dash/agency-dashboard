# 🔧 GitHub Account Wechseln - Kurzanleitung

## **1. Aktuelle Konfiguration überprüfen**
```bash
git config --list | grep user
```

## **2. Globale Git-Konfiguration ändern**
```bash
git config --global user.name "NEUER_USERNAME"
git config --global user.email "NEUE_EMAIL@domain.de"
```

## **3. Lokale Repository-Konfiguration (optional)**
```bash
cd /pfad/zu/deinem/repository
git config --local user.name "NEUER_USERNAME"
git config --local user.email "NEUE_EMAIL@domain.de"
```

## **4. Alte Commit-Autoren korrigieren**
```bash
git commit --amend --author="NEUER_USERNAME <NEUE_EMAIL@domain.de>" --no-edit
```

## **5. Gespeicherte Credentials löschen**
```bash
# macOS Keychain löschen
security delete-internet-password -s github.com

# Credential Helper zurücksetzen
git config --global --unset credential.helper
```

## **6. Repository Remote-URL setzen**
```bash
git remote add origin https://github.com/NEUER_USERNAME/REPOSITORY-NAME.git
# oder
git remote set-url origin https://github.com/NEUER_USERNAME/REPOSITORY-NAME.git
```

## **7. Personal Access Token erstellen**
- Gehe zu: https://github.com/settings/tokens
- "Generate new token (classic)"
- Wähle "repo" Berechtigung
- Token kopieren

## **8. Push mit Token**
```bash
git push -u origin main
```
- **Username:** `NEUER_USERNAME`
- **Password:** `DEIN_TOKEN` (nicht dein GitHub Passwort!)

## **9. Alternative: Token in URL einbetten**
```bash
git remote set-url origin https://NEUER_USERNAME:DEIN_TOKEN@github.com/NEUER_USERNAME/REPOSITORY-NAME.git
git push -u origin main
```

## **10. Konfiguration testen**
```bash
git config --list | grep user
git log --oneline -1 --pretty=format:"%h - %an <%ae> - %s"
```

---
**💡 Tipp:** Diese Anleitung ist jetzt in deinem Projekt gespeichert!
**📅 Erstellt:** $(date)
**🎯 Für Account:** bbdo-dash <dashboard@bddo.de>
