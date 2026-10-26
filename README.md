# iron-lungs.github.io

Portfolio bilingue (FR / EN) d'un ingénieur cybersécurité & réseaux en ESN / MSSP,
publié sur **<https://pages.ironlungs.eu>**.

- **Projets** : missions réseau & sécurité menées sur des parcs clients (anonymisées) et projets personnels
- **Éditeurs** : certifications et solutions administrées en production, éditeur par éditeur (Fortinet FCP, Cisco, Trend Micro, Sophos, BeyondTrust, Sekoia, EasyVista)
- **Compétences** : réseau, sécurité périmétrique, endpoint, SOC, automatisation, avec un niveau de maîtrise par domaine
- **Parcours** : expériences, formation, langues

## Pile

Site 100 % statique : **Jekyll** compilé par **GitHub Pages**, aucun serveur applicatif, aucune base de données.
Polices, styles et scripts hébergés sur le site : ni CDN, ni mesure d'audience, ni cookie.
Le contenu vit dans `_data/*.yml` ; les gabarits (`_layouts/`, `_includes/`) le mettent en forme dans chaque langue.

## Aperçu local

```bash
bundle install && bundle exec jekyll serve --livereload   # http://localhost:4000
```
