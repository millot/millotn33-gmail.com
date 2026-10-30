# Atelier d’analyse artistique — peinture du 30 octobre 2026

Projet autonome intégré au dépôt existant **sans modifier le jeu Super Pixel Plumber**.

## Ouvrir
- En local : ouvrir `analyse-artistique/index.html`.
- Après fusion sur `main` et déploiement GitHub Pages : `/analyse-artistique/` à la suite de l'URL du site.
- Le site est statique, sans suivi, sans dépendance externe, utilisable sur mobile.

## Œuvre analysée
Photographie fournie dans la conversation : peinture expressive figurative aux verts saturés, bleu turquoise, brun sombre, reflets violacés et cadre anthracite. Au centre, une forme animale stylisée avec détails du regard et du museau. Interprétation visuelle prudente, sans identification certaine de l'animal.

Le fichier `assets/peinture-apercu.webp` (560 × 258 pixels) est **une copie compressée de présentation**. L'original de la photographie est resté dans la conversation, non modifié. Pour afficher l'original haute définition sur le site, remplacer volontairement l'aperçu par une version autorisée.

## Critique de départ (jugement subjectif, échelle de travail)
| Critère | /10 | Observation |
|---|---:|---|
| Composition | 6 | Sujet central identifiable, architecture chargée |
| Couleur | 7 | Vert/bleu/brun expressifs |
| Matière | 7 | Reliefs et gestes visibles |
| Lumière | 4 | Valeurs majoritairement sombres |
| Volume 3D | 4 | Transitions lumineuses encore peu lisibles |
| Lisibilité | 5 | Les contours se confondent parfois avec le fond |

**Important :** il ne s'agit pas d'une notation scientifique ou d'une mesure du talent. Les notes sont éditables localement dans la page et sont exportables en JSON ; rien n'est envoyé à un serveur.

## Méthode niveau 2 : modelé 3D
1. Préserver le dessin et marquer trois valeurs : lumière, demi-teinte, ombre.
2. Déterminer une seule direction de lumière (par exemple, haut-gauche).
3. Arrondir joue, front et museau avec des demi-teintes progressives.
4. Renforcer l'occlusion aux jonctions de formes (sous le museau et autour des yeux).
5. Réserver les accents clairs pour les reliefs utiles ; garder la touche picturale.
6. Vérifier à 2 mètres et sur photographie en niveaux de gris.

## Technique
- HTML/CSS/JavaScript natifs.
- Sélection de zones par boutons positionnés sur l'image (sans reconnaître automatiquement les objets).
- Modes comparaison contraste, niveaux de gris, couleurs d'origine.
- Critères ajustables et export local JSON.
- Palette de teintes **échantillonnées indicatives**, non normes de reproduction des pigments.

## Respect des droits
Le dépôt a une licence MIT pour le code ; la photographie de la peinture ne doit pas être supposée libre de droits. Toute réutilisation hors projet nécessite l'autorisation de l'auteur.
