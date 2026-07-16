# Super Pixel Plumber 🎮

Un jeu de plateforme rétro original, jouable directement dans le navigateur. Il reprend les sensations classiques du genre : déplacement horizontal, saut, pièces à collecter, ennemis à écraser, pièges et drapeau de fin.

> Ce projet ne contient aucun sprite, son, logo ou code de Nintendo. Les graphismes sont dessinés en JavaScript dans un `<canvas>`.

## Jouer

Ouvre simplement `index.html` dans un navigateur moderne.

### Commandes

- **Flèche gauche / A** : aller à gauche
- **Flèche droite / D** : aller à droite
- **Espace / Flèche haut / W** : sauter
- **P** : pause
- Sur téléphone : boutons tactiles sous le jeu

## Fonctionnalités

- Niveau horizontal de plus de 5 000 pixels
- Caméra fluide
- Plateformes, blocs bonus, tuyaux et fossés
- 24 pièces à collecter
- Ennemis avec déplacement automatique
- Système de score, vies et chronomètre
- Effets sonores générés avec la Web Audio API
- Interface responsive pour ordinateur et mobile
- Aucun fichier externe ni dépendance

## Publier avec GitHub Pages

1. Ouvre **Settings → Pages** dans le dépôt.
2. Dans **Build and deployment**, choisis **GitHub Actions**.
3. Le workflow `Deploy static game to Pages` publiera automatiquement le jeu à chaque modification de la branche `main`.

## Structure

```text
index.html                  Interface du jeu
styles.css                  Mise en page et commandes tactiles
game.js                     Moteur, physique, niveau et rendu Canvas
.github/workflows/pages.yml Déploiement GitHub Pages
```

## Licence

MIT — libre à modifier, améliorer et partager.
