# --- Étape 1 : build Maven (aucune installation locale de Java/Maven nécessaire) ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copié séparément pour profiter du cache Docker : les dépendances ne sont retéléchargées
# que si pom.xml change, pas à chaque modification du code source.
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# --- Étape 2 : image d'exécution, plus légère (pas de Maven ni de JDK complet) ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
