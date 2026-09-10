FROM eclipse-temurin:21-jdk

WORKDIR /app

RUN apt-get update \
    && apt-get install -y git nodejs npm \
    && npm install -g tsx \
    && rm -rf /var/lib/apt/lists/*

# Get Synthea source
RUN git clone --depth 1 \
    https://github.com/synthetichealth/synthea.git \
    /synthea

WORKDIR /synthea

# Replace Synthea's primary-care provider universe
COPY fixtures/primary_care_facilities.csv \
    ./src/main/resources/providers/primary_care_facilities.csv

# Your local Synthea configuration
COPY config/synthea.properties \
    /app/synthea.properties

# Naming/fixture files
COPY fixtures/organizations.csv \
    /app/fixtures/organizations.csv

COPY fixtures/providers.csv \
    /app/fixtures/providers.csv

COPY scripts/apply-fixtures.mts \
    /app/scripts/apply-fixtures.mts

# Build Synthea with our provider CSV baked into the resources
RUN ./gradlew build -x test

RUN mkdir -p /app/output

WORKDIR /app

CMD ["sh", "-c", "rm -rf /app/output/* && java -jar /synthea/build/libs/synthea-with-dependencies.jar -c /app/synthea.properties -p 100 -s 12345 -cs 67890 Georgia Atlanta && tsx /app/scripts/apply-fixtures.mts"]