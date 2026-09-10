# @healthstack/logger

Structured, environment-aware logging for HealthStack services, built on
[pino](https://getpino.io).

## Why

Every service should produce the same shape of log line so that the platform's
log pipeline (and the humans reading it) can rely on a stable contract, and so
that PHI and secrets are stripped consistently before anything leaves the
process.

## Log record shape

Newline-delimited JSON, in every environment:

| field                                               | notes                                                |
| --------------------------------------------------- | ---------------------------------------------------- |
| `time`                                              | ISO-8601 UTC                                         |
| `level`                                             | textual (`"info"`, not `30`)                         |
| `message`                                           | the log message                                      |
| `service`                                           | service / package name                               |
| `env`                                               | `development` \| `test` \| `staging` \| `production` |
| `version`                                           | build identifier, when provided                      |
| `pid`, `hostname`                                   | process identity                                     |
| `err`                                               | serialized error (stack, type, message)              |
| `requestId`, `correlationId`, `tenantId`, `actorId` | when a context is active                             |

## Environments

| env           | level (default) | transport             |
| ------------- | --------------- | --------------------- |
| `development` | `debug`         | `pino-pretty` (human) |
| `test`        | `silent`        | JSON                  |
| `staging`     | `info`          | JSON                  |
| `production`  | `info`          | JSON                  |

The environment is resolved from `ENVIRONMENT`, falling back to `NODE_ENV`, then
`development`. `LOG_LEVEL` overrides the level in any environment.

Pretty-printing is never used in `staging` / `production` — deployed
environments always emit machine-parseable JSON.

## Usage

```ts
import { initLogger, getLogger } from '@healthstack/logger';

// once, at startup
initLogger({ service: 'healthstack-api', environment: 'production', version: '1.4.0' });

// anywhere
getLogger().info({ patientCount: 12 }, 'batch imported');
```

### Per-request context

```ts
import { runWithContext, contextLogger } from '@healthstack/logger';

runWithContext({ requestId, correlationId, tenantId }, () => {
  contextLogger().info('handling request'); // includes the ids automatically
});
```

### HTTP middleware

```ts
import { createHttpLogger, getLogger } from '@healthstack/logger';

app.use(createHttpLogger({ logger: getLogger() }));
```

## Redaction

`DEFAULT_REDACT_PATHS` blanks credentials and HIPAA Safe Harbor direct
identifiers (`ssn`, `mrn`, `dateOfBirth`, `firstName`, `email`, …) one level deep
inside any logged object. This is a safety net — application code should not log
PHI in the first place. Override per service with `createLogger({ redact: [...] })`.
