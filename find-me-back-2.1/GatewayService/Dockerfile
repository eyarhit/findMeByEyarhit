# syntax=docker/dockerfile:1.4
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY docker/maven/settings.xml /root/.m2/settings.xml
COPY find-me-back-2.1/GatewayService/pom.xml ./pom.xml
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn -B -ntp -DskipTests dependency:go-offline -f pom.xml || true
COPY find-me-back-2.1/GatewayService/src ./src
RUN --mount=type=cache,target=/root/.m2/repository \
    sh -c 'for n in 1 2 3 4 5; do mvn -B -ntp -DskipTests clean package -f pom.xml && exit 0; echo "Maven attempt $n failed, retry in 25s..."; sleep 25; done; exit 1'

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/target/GatewayService-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 9082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
