
// Use the default export for Dexie to ensure proper inheritance and type recognition in ESM environments.
import Dexie, { type Table } from 'https://esm.sh/dexie@4.0.11';
import { Project, StoryNode, Character } from './types';

// Define the SVI database extending Dexie for IndexedDB management
export class SVIDatabase extends Dexie {
  projects!: Table<Project>;
  nodes!: Table<StoryNode>;
  characters!: Table<Character>;

  constructor() {
    // Pass the database name to the Dexie constructor
    super('SVI_Pro_DB');
    
    // Define the database version and schema. 
    // The 'version' method is inherited from the Dexie base class.
    // Fixed: Using default Dexie import ensures 'version' is correctly typed as a member of the base class.
    (this as any).version(1).stores({
      projects: 'id, title, lastUpdate, status',
      nodes: 'id, projectId, parentId, branchId, status',
      characters: 'id, name, lastUsed'
    });
  }
}

export const db = new SVIDatabase();
