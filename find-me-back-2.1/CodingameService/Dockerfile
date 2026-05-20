FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/target/CodingameService-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 9056
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

