import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsRoot = dirname(fileURLToPath(import.meta.url));

export function loadStaticContractManifest(fileName) {
  const path = join(toolsRoot, 'static-contracts', fileName);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function peersFromPeerSets(manifest, peerSetNames) {
  const peers = [];
  for (const setName of peerSetNames) {
    const setPeers = manifest.peerSets?.[setName];
    if (!Array.isArray(setPeers)) {
      throw new Error(`${manifest.id ?? 'peer manifest'} is missing peer set ${setName}`);
    }
    peers.push(...setPeers);
  }
  return [...new Set(peers)];
}

export function peerGroupContractsFromManifest(manifest) {
  return Object.fromEntries(
    Object.entries(manifest.peerGroups ?? {}).map(([groupName, contract]) => [
      groupName,
      {
        tier: contract.tier,
        peers: peersFromPeerSets(manifest, contract.peerSets ?? []),
      },
    ]),
  );
}

export function peerCategoryContractsFromManifest(manifest, categoryPeerSets) {
  return Object.fromEntries(
    Object.entries(categoryPeerSets ?? {}).map(([category, peerSetNames]) => [
      category,
      peersFromPeerSets(manifest, peerSetNames),
    ]),
  );
}
