import PocketBase, { RecordService } from 'pocketbase';

// Define your collection types with all required fields
type Collections = {
  users: {
    id: string;
    email: string;
    username: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    verified: boolean;
    created: string;
    updated: string;
  };
  // Add other collections here as needed
};

// Extend PocketBase with typed collection method
export type TypedPocketBase = PocketBase & {
  collection<K extends keyof Collections>(idOrName: K): RecordService<Collections[K]>;
  // Add custom methods
  getUserProfile(): Promise<Collections['users'] | null>;
  updateUserProfile(data: Partial<Collections['users']>): Promise<Collections['users']>;
};

// Initialize and export the PocketBase client
let pb: TypedPocketBase;

if (typeof window !== 'undefined') {
  pb = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
  ) as TypedPocketBase;

  // Enable auto cancellation (set to false if you want to keep requests alive)
  pb.autoCancellation(true);

  // Load auth from cookie if available
  pb.authStore.loadFromCookie(document.cookie);

  // Update cookie whenever auth changes
  pb.authStore.onChange((token, model) => {
    document.cookie = pb.authStore.exportToCookie({
      httpOnly: false, // Set to true in production if using HTTPS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    });
  });

  // Add custom methods to the client
  pb.getUserProfile = async () => {
    if (!pb.authStore.isValid) return null;
    
    try {
      // Refresh auth if needed
      await pb.collection('users').authRefresh();
      
      // Return the full user record
      return await pb.collection('users').getOne(pb.authStore.model!.id);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      pb.authStore.clear();
      return null;
    }
  };

  pb.updateUserProfile = async (data) => {
    if (!pb.authStore.isValid) {
      throw new Error('Not authenticated');
    }

    // Only allow updating specific fields
    const updateData = {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      // Add other updatable fields here
    };

    return await pb.collection('users').update(pb.authStore.model!.id, updateData);
  };
} else {
  // Server-side fallback with type casting
  pb = {} as TypedPocketBase;
}

export default pb;