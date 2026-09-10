import fs from 'node:fs';
import path from 'node:path';

type FhirResource = {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
};

type BundleEntry = {
  fullUrl?: string;
  resource?: FhirResource;
};

type Bundle = FhirResource & {
  resourceType: 'Bundle';
  entry?: BundleEntry[];
};

type OrganizationFixture = {
  organizationId: string;
  name: string;
};

type ProviderFixture = {
  providerId: string;
  organizationId: string;
  name: string;
  specialty: string;
};

type PractitionerAssignment = {
  organizationId: string;
  provider: ProviderFixture;
};

type JsonObject = Record<string, unknown>;

const ROOT = process.cwd();
const FHIR_DIR = path.join(ROOT, 'output', 'fhir');
const ORGANIZATIONS_FILE = path.join(ROOT, 'fixtures', 'organizations.csv');
const PROVIDERS_FILE = path.join(ROOT, 'fixtures', 'providers.csv');

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf8').trim();

  if (!content) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const headerLine = lines.shift();

  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(',').map((value) => value.trim());

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = line.split(',').map((value) => value.trim().replace(/^"(.*)"$/, '$1'));

      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    });
}

function loadOrganizations(): OrganizationFixture[] {
  return parseCsv(ORGANIZATIONS_FILE).map((row) => ({
    organizationId: row.organization_id ?? '',
    name: row.name ?? '',
  }));
}

function loadProviders(): ProviderFixture[] {
  return parseCsv(PROVIDERS_FILE).map((row) => ({
    providerId: row.provider_id ?? '',
    organizationId: row.organization_id ?? '',
    name: row.name ?? '',
    specialty: row.specialty ?? '',
  }));
}

function getFhirFiles(): string[] {
  if (!fs.existsSync(FHIR_DIR)) {
    throw new Error(`FHIR output directory does not exist: ${FHIR_DIR}`);
  }

  return fs
    .readdirSync(FHIR_DIR)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => file !== 'provider-fixtures.json')
    .map((file) => path.join(FHIR_DIR, file));
}

function loadBundle(filePath: string): Bundle {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as FhirResource;

  if (parsed.resourceType !== 'Bundle') {
    throw new Error(`${filePath} does not contain a FHIR Bundle`);
  }

  return parsed as Bundle;
}

function extractOrganizationId(reference: unknown): string | undefined {
  if (typeof reference !== 'string') {
    return undefined;
  }

  const direct = reference.match(/^Organization\/(BRHA|CVMG)$/);
  if (direct) {
    return direct[1];
  }

  if (reference.includes('BRHA')) {
    return 'BRHA';
  }

  if (reference.includes('CVMG')) {
    return 'CVMG';
  }

  return undefined;
}

function getEncounterOrganizationId(resource: FhirResource): string | undefined {
  const serviceProvider = resource.serviceProvider;

  if (!isObject(serviceProvider)) {
    return undefined;
  }

  return extractOrganizationId(serviceProvider.reference);
}

function getPractitionerReferenceFromEncounter(resource: FhirResource): string | undefined {
  if (!Array.isArray(resource.participant)) {
    return undefined;
  }

  for (const participant of resource.participant) {
    if (!isObject(participant) || !isObject(participant.individual)) {
      continue;
    }

    const reference = participant.individual.reference;

    if (typeof reference === 'string' && reference.startsWith('Practitioner')) {
      return reference;
    }
  }

  return undefined;
}

function createAssignments(
  bundles: Bundle[],
  providers: ProviderFixture[],
): Map<string, PractitionerAssignment> {
  const practitionerRefsByOrg = new Map<string, Set<string>>();

  for (const bundle of bundles) {
    for (const entry of bundle.entry ?? []) {
      const resource = entry.resource;

      if (!resource || resource.resourceType !== 'Encounter') {
        continue;
      }

      const organizationId = getEncounterOrganizationId(resource);
      const practitionerRef = getPractitionerReferenceFromEncounter(resource);

      if (!organizationId || !practitionerRef) {
        continue;
      }

      const refs = practitionerRefsByOrg.get(organizationId) ?? new Set<string>();
      refs.add(practitionerRef);
      practitionerRefsByOrg.set(organizationId, refs);
    }
  }

  const assignments = new Map<string, PractitionerAssignment>();

  for (const [organizationId, refs] of practitionerRefsByOrg.entries()) {
    const organizationProviders = providers
      .filter((provider) => provider.organizationId === organizationId)
      .sort((a, b) => a.providerId.localeCompare(b.providerId));

    const sortedRefs = [...refs].sort();

    if (sortedRefs.length > organizationProviders.length) {
      throw new Error(
        `${organizationId} generated ${sortedRefs.length} practitioners but only ` +
          `${organizationProviders.length} fixture names are available.`,
      );
    }

    sortedRefs.forEach((reference, index) => {
      const provider = organizationProviders[index];

      if (!provider) {
        return;
      }

      assignments.set(reference, {
        organizationId,
        provider,
      });
    });
  }

  return assignments;
}

function makePractitionerReference(provider: ProviderFixture): JsonObject {
  return {
    reference: `Practitioner/${provider.providerId}`,
    display: provider.name,
  };
}

function rewriteObject(value: unknown, assignments: Map<string, PractitionerAssignment>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      rewriteObject(item, assignments);
    }

    return;
  }

  if (!isObject(value)) {
    return;
  }

  const reference = value.reference;

  if (typeof reference === 'string') {
    const assignment = assignments.get(reference);

    if (assignment) {
      const replacement = makePractitionerReference(assignment.provider);
      value.reference = replacement.reference;
      value.display = replacement.display;
    }
  }

  for (const child of Object.values(value)) {
    rewriteObject(child, assignments);
  }
}

function rewriteBundle(bundle: Bundle, assignments: Map<string, PractitionerAssignment>): void {
  rewriteObject(bundle, assignments);
}

function main(): void {
  const organizations = loadOrganizations();
  const providers = loadProviders();

  if (organizations.length !== 2) {
    throw new Error(`Expected 2 organizations, found ${organizations.length}`);
  }

  for (const organization of organizations) {
    const count = providers.filter(
      (provider) => provider.organizationId === organization.organizationId,
    ).length;

    if (count !== 5) {
      throw new Error(`Expected 5 providers for ${organization.organizationId}, found ${count}`);
    }
  }

  const files = getFhirFiles();
  const bundles = files.map(loadBundle);
  const assignments = createAssignments(bundles, providers);

  console.log(`Loaded ${organizations.length} organizations.`);
  console.log(`Loaded ${providers.length} provider names.`);
  console.log(`Mapped ${assignments.size} generated practitioner references.`);

  bundles.forEach((bundle, index) => {
    rewriteBundle(bundle, assignments);

    fs.writeFileSync(files[index]!, JSON.stringify(bundle, null, 2), 'utf8');
  });

  for (const [originalReference, assignment] of assignments.entries()) {
    console.log(
      `${originalReference} -> Practitioner/${assignment.provider.providerId} ` +
        `(${assignment.provider.name}, ${assignment.organizationId})`,
    );
  }

  console.log(`Updated ${bundles.length} FHIR bundles.`);
}

main();
