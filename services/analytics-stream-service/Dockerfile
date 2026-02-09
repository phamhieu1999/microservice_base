FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -q -e -B -DskipTests dependency:go-offline || true

COPY src ./src
RUN mvn -q -e -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /app/target/analytics-stream-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8099

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

