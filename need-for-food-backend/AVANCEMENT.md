# Avancement du projet — Need for Food (Backend)

Document de suivi du développement du backend. Complète le *Dossier Projet* (conception) en décrivant ce qui a été **réellement implémenté et testé** dans le code.

---

## 1. Vue d'ensemble

| Domaine | État |
|---|---|
| Configuration projet (Maven, dépendances) | ✅ Fait |
| Modèle de données PostgreSQL | ✅ Fait |
| Modèle de données MongoDB | ✅ Fait (documents + repositories, pas encore utilisés) |
| Authentification JWT | ✅ Fait |
| CRUD Recettes / Ingrédients | ✅ Fait |
| Génération de liste de courses | ⚠️ Partiel (fusion des recettes OK, soustraction du stock disponible manquante) |
| Suggestions de recettes par ingrédients disponibles | ❌ Pas commencé |
| Préférences utilisateur | ❌ Pas commencé (documents Mongo prêts, pas de service/API) |
| Partage de recette | ❌ Pas commencé |
| RGPD (export/suppression complète) | ⚠️ Partiel (suppression de compte basique) |
| Frontend React Native | ❌ Pas commencé dans ce projet backend |
| Déploiement | ❌ Pas commencé |

---

## 2. Ce qui a été fait

### 2.1. Configuration projet

- **`pom.xml`** — Spring Boot 3.3.5 / Java 17, dépendances : `web`, `data-jpa`, `data-mongodb`, `security`, `validation`, driver `postgresql`, `flyway-core` + `flyway-database-postgresql`, `jjwt` (JWT), `lombok`.
- Lombok forcé en version 1.18.46 et déclaré explicitement en `annotationProcessorPaths` — la détection implicite ne fonctionne pas avec Maven 3.9.16 + JDK 25 sur cette machine (bug silencieux : aucune méthode générée, sans erreur de compilation).
- **`docker-compose.yml`** — 3 services : `postgres` (16-alpine), `pgadmin` (interface web), `mongodb` (7). Volumes persistants, healthcheck sur Postgres.
- **`.env` / `.env.example`** — identifiants de connexion (jamais en dur dans le code, conforme à la section 4.1 du dossier).
- **`application.yml` / `application-dev.yml`** — configuration Spring (ports, Flyway, JPA, Mongo, secret JWT), toutes les valeurs sensibles injectées via variables d'environnement avec des valeurs par défaut pour le dev local.

### 2.2. Modèle de données PostgreSQL (`model/entity/`)

Tables créées via Flyway (`db/migration/V1__init_schema.sql`, `V2__shopping_list.sql`) :

- **`app_user`** *(entité `User`)* — comptes utilisateurs (`user` est un mot réservé PostgreSQL, d'où le nom de table différent).
- **`recipe`** *(entité `Recipe`)* — recettes, liées à un utilisateur (FK `user_id`).
- **`ingredient`** *(entité `Ingredient`)* — catalogue d'ingrédients, nom unique.
- **`recipe_ingredient`** *(entité `RecipeIngredient`)* — table de liaison recette↔ingrédient (clé composite), quantité.
- **`preparation_step`** *(entité `PreparationStep`)* — étapes de préparation numérotées.
- **`shopping_list`** / **`shopping_list_item`** *(entités `ShoppingList`, `ShoppingListItem`)* — listes de courses et leurs articles (clé composite liste↔ingrédient, quantité, coché/non coché).

Toutes les FK sont en `ON DELETE CASCADE` (supprimer un compte supprime ses recettes et listes — cohérent avec les exigences RGPD du dossier).

### 2.3. Accès aux données (`repository/sql/`, `repository/nosql/`)

- Repositories Spring Data JPA : `UserRepository`, `RecipeRepository`, `IngredientRepository`, `ShoppingListRepository`.
- `RecipeRepository`/`ShoppingListRepository` exposent des requêtes `JOIN FETCH` dédiées (`findDetailedById`, `findDetailedByUserId`) pour charger les collections liées en une seule requête (voir §5, bug de lazy loading).
- Repositories Spring Data MongoDB : `UserPreferenceRepository`, `RecipeSearchIndexRepository`, `AvailableIngredientsSessionRepository`, `ShoppingListHistoryRepository`.

### 2.4. Modèle de données MongoDB (`model/document/`)

Les 4 collections prévues au dossier (section 7.2.2), implémentées mais **pas encore reliées à une logique métier** :

- **`UserPreference`** *(`user_preferences`)* — régime alimentaire, allergies, ingrédients détestés, types de recettes favoris, temps de préparation max.
- **`RecipeSearchIndex`** *(`recipe_search_index`)* — index dénormalisé pour la recherche rapide (pas encore alimenté depuis PostgreSQL).
- **`AvailableIngredientsSession`** *(`available_ingredients_sessions`)* — ingrédients disponibles déclarés par l'utilisateur.
- **`ShoppingListHistory`** *(`shopping_list_history`)* — historique des listes générées.

`IngredientQuantity` est un type imbriqué partagé (nom/quantité/unité) réutilisé par les deux dernières collections.

### 2.5. Sécurité et authentification (`security/`, `service/AuthService.java`)

- **`JwtTokenProvider`** — génération et validation de tokens JWT (HMAC, expiration configurable).
- **`JwtAuthenticationFilter`** — lit le header `Authorization: Bearer ...`, authentifie la requête.
- **`SecurityConfig`** — `/api/auth/**` public, tout le reste exige un token valide (401 explicite si absent/invalide).
- Mots de passe hachés en BCrypt (`PasswordEncoder`), jamais stockés en clair — conforme à la section 4.1 du dossier.
- **`AuthService`** — inscription (délègue à `UserService`) et connexion (vérifie le mot de passe, émet le JWT).

### 2.6. Services métier (`service/`)

- **`UserService`** — inscription (email unique, hash du mot de passe), consultation, mise à jour du profil, suppression de compte.
- **`RecipeService`** — création/consultation/modification/suppression de recette, avec vérification du propriétaire pour modifier/supprimer. Résolution des ingrédients par nom (réutilise un ingrédient existant plutôt que d'en créer un doublon).
- **`IngredientService`** — consultation du catalogue, `findOrCreate` (logique partagée par `RecipeService` et `ShoppingListService`).
- **`ShoppingListService`** — création de liste, **génération automatique à partir de recettes sélectionnées** (fusionne les quantités si un ingrédient apparaît dans plusieurs recettes), ajout/suppression/coche d'articles, avec vérification du propriétaire sur toutes les opérations (les listes de courses sont strictement privées, contrairement aux recettes qui restent consultables par tout utilisateur connecté).

### 2.7. API REST (`controller/`)

| Contrôleur | Endpoints | Auth |
|---|---|---|
| `AuthController` | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| `UserController` | `GET /api/users/me` | Requiert JWT |
| `RecipeController` | `POST/GET/PUT/DELETE /api/recipes[/{id}]`, `GET /api/recipes/mine` | Requiert JWT |
| `IngredientController` | `GET /api/ingredients[/{id}]` | Requiert JWT |
| `ShoppingListController` | `POST /api/shopping-lists`, `POST /api/shopping-lists/generate`, `GET /mine`, `GET/{id}`, `POST/PATCH/DELETE /{id}/items[/{ingredientId}]`, `DELETE /{id}` | Requiert JWT |

- DTOs séparés des entités (`dto/request/`, `dto/response/`) — le `passwordHash` par exemple n'est jamais exposé dans une réponse API.
- Validation Bean Validation sur les DTOs de requête (champs obligatoires, formats, tailles minimales).
- **`GlobalExceptionHandler`** — convertit les exceptions métier en codes HTTP corrects (404 ressource introuvable, 409 email dupliqué, 401 identifiants invalides, 403 accès refusé, 400 validation).

### 2.8. Tests

**27 tests d'intégration**, exécutés contre de **vraies** instances PostgreSQL et MongoDB (pas de mocks ni de base embarquée) :

- `JpaRepositoriesIntegrationTest`, `MongoRepositoriesIntegrationTest` — repositories.
- `UserServiceIntegrationTest`, `RecipeServiceIntegrationTest` — services.
- `AuthFlowIntegrationTest`, `RecipeFlowIntegrationTest`, `ShoppingListFlowIntegrationTest` — flux HTTP complets via `MockMvc` (inscription → connexion → utilisation du token → cas d'erreur).

---

## 3. Bugs réels trouvés et corrigés en testant

Ces bugs n'apparaissaient pas à la simple lecture du code ni en compilant — seuls des tests contre de vraies requêtes HTTP séparées (comme le fait Postman) les ont révélés :

1. **`LazyInitializationException` sur `GET /api/recipes/{id}` et `/mine`** — les ingrédients d'une recette étaient chargés "à la demande" par Hibernate, mais la session base de données était déjà fermée au moment de construire la réponse JSON (`spring.jpa.open-in-view=false`). Corrigé avec des requêtes `JOIN FETCH` dédiées.
2. **Même bug sur `POST /api/shopping-lists/generate`** — trouvé avant qu'il ne pose problème en test manuel.
3. **`PUT /api/recipes/{id}` cassait à la modification** — supprimer puis recréer les ingrédients/étapes d'une recette provoque un conflit Hibernate (les `INSERT` s'exécutent avant les `DELETE` dans un même flush, violant les contraintes d'unicité). Corrigé en forçant l'exécution des suppressions (`flush()`) avant de recréer les lignes.

**Point de vigilance retenu** : dans la configuration de sécurité actuelle, une exception serveur non gérée pendant la construction de la réponse ressort en **401** plutôt qu'en 500 — à garder en tête si un 401 apparaît sur une route où l'authentification a l'air correcte par ailleurs.

**Point d'hygiène (pas un bug)** : les tests automatisés et les tests manuels Postman partagent la même base de données de développement. Certains tests peuvent échouer par collision de données (email/ingrédient déjà existant) sans que ce soit un défaut du code.

---

## 4. Ce qu'il reste à faire

### Backend — fonctionnalités du dossier pas encore implémentées

- **Suggestions de recettes à partir des ingrédients disponibles** (section 5.4 du dossier) — nécessite `AvailableIngredientsSession` (Mongo) + un `SuggestionService` qui croise les ingrédients disponibles avec les recettes PostgreSQL.
- **Soustraction du stock disponible dans la génération de liste de courses** (section 5.5) — `ShoppingListService.generateFromRecipes` fonctionne aujourd'hui uniquement à partir des recettes ; il faudrait croiser avec `AvailableIngredientsSession` pour ne lister que les ingrédients manquants.
- **Gestion des préférences utilisateur** — `PreferenceService` + `PreferenceController` pour exposer `UserPreference` (déjà modélisé côté Mongo).
- **Alimentation de `RecipeSearchIndex`** — synchroniser cette collection à chaque création/modification de recette dans `RecipeService`, sinon elle reste vide et inutile.
- **Recherche de recettes multi-critères** (nom, type, régime, temps de préparation — section 5.2) — actuellement seule la consultation par id ou par utilisateur existe, pas de recherche/filtrage.
- **Partage de recette** — présent dans le diagramme de cas d'utilisation du dossier, pas encore d'endpoint.
- **RGPD complet** — la suppression de compte existe (cascade SQL), mais pas d'export des données personnelles ni d'anonymisation.

### Backend — qualité / industrialisation

- Documentation API (Swagger / OpenAPI) — aucune pour l'instant.
- Isoler une base de données dédiée aux tests (actuellement partagée avec les tests manuels Postman, cause des faux échecs occasionnels — voir §3).
- `application-prod.yml` — seul `application-dev.yml` existe.
- Logs applicatifs structurés / journalisation des actions sensibles (mentionné section 4.1 du dossier).
- Sauvegardes automatiques de la base (mentionné section 4.1 du dossier, infrastructure pas encore mise en place).

### Frontend

Rien n'a été commencé côté React Native dans le cadre de ce travail — tout l'effort a porté sur le backend Java/Spring Boot.

### Déploiement

Pas d'environnement de déploiement configuré (le dossier prévoit une phase dédiée, section 3.5).

---

## 5. Comment relancer l'environnement de développement

```bash
# Démarrer les bases de données
docker compose up -d postgres mongodb

# Lancer l'application (depuis IntelliJ ou via Maven)
mvn spring-boot:run
# → écoute sur http://localhost:8080, profil "dev" actif par défaut

# Lancer les tests
mvn test
```

pgAdmin (`http://localhost:5050`) et MongoDB Compass (natif, `localhost:27017`) permettent d'inspecter les données. Identifiants dans `.env`.
