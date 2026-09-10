## Raw Clinical Data Object Storage

The raw ingestion layer uses MinIO for local development and can use an S3-compatible object store such as Amazon S3 in deployed environments. Each tenant is assigned a dedicated bucket, providing a clear storage and security boundary between tenants.

## Bucket Structure

MINIO / AWS / Google Storage

├── **Blue Ridge Health Alliance**/
│ └── {sourceSystem}/
│ └── {format}/
│ └── {resourceType}/
│ └── {resourceId}/
│ └── {sha256}.json
│
└── **Cedar Valley Medical Group**/
└── {sourceSystem}/
└── {format}/
└── {resourceType}/
└── {resourceId}/
└── {sha256}.json

Each level represents:

- Tenant bucket: A dedicated bucket for each tenant, such as Blue Ridge Health Alliance or Cedar Valley Medical Group.
- sourceSystem: The originating clinical system, such as Athena, Epic, or eClinicalWorks.
- format: The format of the source data, such as fhir, hl7v2, csv, or another supported format.
- resourceType: For FHIR data, the FHIR resource type, such as Patient, Condition, Observation, or Encounter.
- resourceId: The logical FHIR resource ID supplied by the source system.
- sha256: A SHA-256 hash calculated from the canonical JSON representation of the resource.

For example:

Blue Ridge Health Alliance/
└── athena/
└── fhir/
├── Patient/
│ └── 123/
│ └── a17c9e...json
│
└── Observation/
└── 987/
├── b8214f...json
└── f329ab...json

Multiple hashes under the same resource ID indicate that multiple distinct representations of that resource have been observed.

FHIR Ingestion and Deduplication

FHIR data may arrive as Bundles, NDJSON, or individual resources. Bundle and NDJSON payloads are parsed into individual FHIR resources before persistence.

FHIR Bundle / NDJSON
│
▼
Parse
│
▼
Extract individual FHIR resource
│
▼
Canonical JSON serialization
│
▼
Calculate SHA-256
│
▼
Store in MinIO / S3

The resulting FHIR object key is:

{sourceSystem}/fhir/{resourceType}/{resourceId}/{sha256}.json

For example:

athena/fhir/Patient/123/a17c9e...json

Canonicalization

Before calculating the SHA-256 hash, each extracted FHIR resource is serialized into a deterministic JSON representation.

Canonicalization ensures that insignificant differences in JSON serialization, such as whitespace or object-property ordering, do not cause otherwise equivalent resources to receive different hashes.

For example, these objects should produce the same canonical representation:

{"resourceType":"Patient","id":"123","active":true}
{"active":true,"id":"123","resourceType":"Patient"}

Object properties are ordered deterministically during canonicalization. Array ordering is preserved because array position may carry meaning and should not be altered merely for hashing.

Content-Addressed Deduplication

The SHA-256 value acts as the content identifier for an individual resource representation.

If the same resource is received repeatedly without changing:

Patient/123 → SHA-256 AAA
Patient/123 → SHA-256 AAA
Patient/123 → SHA-256 AAA

only one object needs to exist:

Patient/
└── 123/
└── AAA.json

If the resource changes:

Patient/123 → SHA-256 BBB

the new representation is stored alongside the previous representation:

Patient/
└── 123/
├── AAA.json
└── BBB.json

The raw object-storage layer is treated as immutable. Existing resource representations are not overwritten when newer representations are received.

Ingestion History

Object deduplication should remain separate from ingestion provenance.

Receiving the same resource multiple times may be operationally significant even when the underlying content is identical. The ingestion metadata layer should therefore record each observation of a resource independently of whether a new object was created.

For example:

Ingestion Run 1 ──► Patient/123/AAA
Ingestion Run 2 ──► Patient/123/AAA
Ingestion Run 3 ──► Patient/123/BBB

The object store contains two unique representations:

Patient/123/
├── AAA.json
└── BBB.json

while the ingestion ledger records all three ingestion events.

Where available, FHIR metadata such as meta.versionId and meta.lastUpdated should also be captured in the ingestion/resource metadata layer. These values remain distinct from the SHA-256 content identifier:

- SHA-256: Identifies a unique canonical representation of the resource.
- FHIR meta.versionId: Identifies the version assigned by the source FHIR server.
- FHIR meta.lastUpdated: Indicates when the source reports that resource version was last modified.
- Ingestion timestamp: Indicates when the platform received the resource.

This design provides tenant isolation, source provenance, deterministic deduplication, immutable raw-data retention, resource history, and replayability while avoiding unnecessary duplicate object storage.

One architectural detail I preserved deliberately: {format} comes before the FHIR-specific {resourceType}/{resourceId} hierarchy, since non-FHIR formats such as CSV or HL7 v2 will need their own format-specific organization below that point.
