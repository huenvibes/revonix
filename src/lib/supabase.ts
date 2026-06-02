import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect placeholder configuration
export const isPlaceholderConfig = !supabaseUrl || 
  supabaseUrl.includes('your-project') || 
  supabaseUrl.includes('placeholder-url') ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'your-anon-key' ||
  supabaseAnonKey === 'placeholder-key';

export const isDemoMode = isPlaceholderConfig;

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  balance: number;
  total_earned: number;
  level: string;
  created_at: string;
};

// --- CLIENT-SIDE LOCAL STORAGE WORKLOG / SANDBOX SIMULATION ---

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderColumn: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private currentPromise: Promise<any> | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getData(): any[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(`revonix_mock_${this.tableName}`);
    return raw ? JSON.parse(raw) : [];
  }

  private saveData(data: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`revonix_mock_${this.tableName}`, JSON.stringify(data));
  }

  select(columns?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderColumn = column;
    this.orderAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private executeQuery(): any[] {
    let items = this.getData();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    if (this.orderColumn) {
      items = [...items].sort((a, b) => {
        const valA = a[this.orderColumn!];
        const valB = b[this.orderColumn!];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== null) {
      items = items.slice(0, this.limitCount);
    }
    return items;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    if (this.currentPromise) {
      return this.currentPromise.then(onfulfilled, onrejected);
    }
    const data = this.executeQuery();
    const result = { data, error: null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  async single() {
    if (this.currentPromise) {
      const res = await this.currentPromise;
      const arr = Array.isArray(res.data) ? res.data : [res.data];
      if (arr.length === 0 || !res.data) {
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
      }
      return { data: Array.isArray(res.data) ? res.data[0] : res.data, error: null };
    }
    const data = this.executeQuery();
    if (data.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
    }
    return { data: data[0], error: null };
  }

  insert(record: any) {
    this.currentPromise = (async () => {
      const items = this.getData();
      const records = Array.isArray(record) ? record : [record];
      const newItems = records.map(r => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        ...r
      }));
      this.saveData([...items, ...newItems]);
      const resData = Array.isArray(record) ? newItems : newItems[0];
      return { data: resData, error: null };
    })();
    return this;
  }

  upsert(record: any) {
    this.currentPromise = (async () => {
      const items = this.getData();
      const records = Array.isArray(record) ? record : [record];
      const updatedItems = [...items];

      for (const r of records) {
        const idx = updatedItems.findIndex(item => 
          (r.id && item.id === r.id) || 
          (r.user_id && item.user_id === r.user_id) ||
          (this.tableName === 'profiles' && r.id && item.id === r.id)
        );

        if (idx > -1) {
          updatedItems[idx] = { ...updatedItems[idx], ...r, updated_at: new Date().toISOString() };
        } else {
          updatedItems.push({
            id: r.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
            created_at: new Date().toISOString(),
            ...r
          });
        }
      }

      this.saveData(updatedItems);
      const matchedRecords = Array.isArray(record) 
        ? updatedItems.filter(item => records.some(r => r.id === item.id || r.user_id === item.user_id))
        : updatedItems.find(item => item.id === record.id || item.user_id === record.user_id || (this.tableName === 'profiles' && item.id === record.id));

      return { data: matchedRecords || record, error: null };
    })();
    return this;
  }

  update(record: any) {
    this.currentPromise = (async () => {
      await Promise.resolve(); // allow chained .eq() to run
      const items = this.getData();
      const updatedItems = [...items];
      const filteredIndexes: number[] = [];

      for (let i = 0; i < updatedItems.length; i++) {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(updatedItems[i])) {
            match = false;
            break;
          }
        }
        if (match) {
          updatedItems[i] = { ...updatedItems[i], ...record, updated_at: new Date().toISOString() };
          filteredIndexes.push(i);
        }
      }

      this.saveData(updatedItems);
      const updatedList = filteredIndexes.map(idx => updatedItems[idx]);
      return { data: updatedList, error: null };
    })();
    return this;
  }
}

class MockAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('revonix_mock_initialized')) {
      localStorage.setItem('revonix_mock_users', JSON.stringify([
        {
          id: 'demo-user-123',
          email: 'demo@example.com',
          password: 'password',
          user_metadata: { full_name: 'Demo Member' }
        }
      ]));
      
      localStorage.setItem('revonix_mock_profiles', JSON.stringify([
        {
          id: 'demo-user-123',
          email: 'demo@example.com',
          full_name: 'Demo Member',
          balance: 24.50,
          total_earned: 45.00,
          level: 'Intermediate',
          created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString()
        }
      ]));

      localStorage.setItem('revonix_mock_reward_transactions', JSON.stringify([
        {
          id: 'tx-1',
          user_id: 'demo-user-123',
          trans_id: 't1',
          provider: 'Spades',
          offer_name: 'Play Game: Reach Level 10',
          payout: 15.00,
          status: 'completed',
          created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString()
        },
        {
          id: 'tx-2',
          user_id: 'demo-user-123',
          trans_id: 't2',
          provider: 'Revtoo',
          offer_name: 'Survey: Food Preferences',
          payout: 3.50,
          status: 'completed',
          created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString()
        }
      ]));

      localStorage.setItem('revonix_mock_payout_requests', JSON.stringify([
        {
          id: 'payout-1',
          user_id: 'demo-user-123',
          amount: 10.00,
          payout_method: 'PayPal',
          payment_details: 'demo@example.com',
          status: 'completed',
          created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString()
        }
      ]));

      localStorage.setItem('revonix_mock_initialized', 'true');
    }
  }

  async getSession() {
    if (typeof window === 'undefined') return { data: { session: null }, error: null };
    const sessionStr = localStorage.getItem('revonix_mock_session');
    if (sessionStr) {
      return { data: { session: JSON.parse(sessionStr) }, error: null };
    }
    return { data: { session: null }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    
    // Fire initial trigger
    this.getSession().then(({ data }) => {
      callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  private triggerChange(event: string, session: any) {
    this.listeners.forEach(l => l(event, session));
  }

  async signUp({ email, password, options }: any) {
    if (typeof window === 'undefined') return { data: null, error: { message: 'Server context' } };
    const users = JSON.parse(localStorage.getItem('revonix_mock_users') || '[]');
    if (users.some((u: any) => u.email === email)) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const userId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const fullName = options?.data?.full_name || email.split('@')[0];

    const newUser = {
      id: userId,
      email,
      password,
      user_metadata: { full_name: fullName }
    };

    users.push(newUser);
    localStorage.setItem('revonix_mock_users', JSON.stringify(users));

    // Create profile
    const profiles = JSON.parse(localStorage.getItem('revonix_mock_profiles') || '[]');
    profiles.push({
      id: userId,
      email,
      full_name: fullName,
      balance: 0,
      total_earned: 0,
      level: 'Beginner',
      created_at: new Date().toISOString()
    });
    localStorage.setItem('revonix_mock_profiles', JSON.stringify(profiles));

    // Sign in automatically
    const session = {
      access_token: 'mock-token',
      user: {
        id: userId,
        email,
        user_metadata: { full_name: fullName }
      }
    };

    localStorage.setItem('revonix_mock_session', JSON.stringify(session));
    this.triggerChange('SIGNED_IN', session);

    return { data: { user: session.user, session }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    if (typeof window === 'undefined') return { data: null, error: { message: 'Server context' } };
    const users = JSON.parse(localStorage.getItem('revonix_mock_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }

    const session = {
      access_token: 'mock-token',
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    };

    localStorage.setItem('revonix_mock_session', JSON.stringify(session));
    this.triggerChange('SIGNED_IN', session);

    return { data: { user: session.user, session }, error: null };
  }

  async signOut() {
    if (typeof window === 'undefined') return { error: null };
    localStorage.removeItem('revonix_mock_session');
    this.triggerChange('SIGNED_OUT', null);
    return { error: null };
  }

  async updateUser({ data, email, password }: any) {
    if (typeof window === 'undefined') return { error: { message: 'Server context' } };
    const sessionStr = localStorage.getItem('revonix_mock_session');
    if (!sessionStr) return { error: { message: 'No active session' } };

    const session = JSON.parse(sessionStr);
    const userId = session.user.id;

    const users = JSON.parse(localStorage.getItem('revonix_mock_users') || '[]');
    const userIdx = users.findIndex((u: any) => u.id === userId);

    if (userIdx > -1) {
      if (email) users[userIdx].email = email;
      if (password) users[userIdx].password = password;
      if (data) {
        users[userIdx].user_metadata = { ...(users[userIdx].user_metadata || {}), ...data };
      }
      localStorage.setItem('revonix_mock_users', JSON.stringify(users));

      session.user.email = users[userIdx].email;
      session.user.user_metadata = users[userIdx].user_metadata;
      localStorage.setItem('revonix_mock_session', JSON.stringify(session));
    }

    // Update profile
    const profiles = JSON.parse(localStorage.getItem('revonix_mock_profiles') || '[]');
    const profileIdx = profiles.findIndex((p: any) => p.id === userId);
    if (profileIdx > -1) {
      if (email) profiles[profileIdx].email = email;
      if (data?.full_name) profiles[profileIdx].full_name = data.full_name;
      localStorage.setItem('revonix_mock_profiles', JSON.stringify(profiles));
    }

    this.triggerChange('USER_UPDATED', session);
    return { data: { user: session.user }, error: null };
  }
}

class MockSupabase {
  auth = new MockAuth();

  from(table: string) {
    return new MockQueryBuilder(table);
  }

  async rpc(func: string, args?: any) {
    if (func === 'delete_user') {
      if (typeof window === 'undefined') return { data: null, error: null };
      const sessionStr = localStorage.getItem('revonix_mock_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const userId = session.user.id;
        
        // Remove from users
        const users = JSON.parse(localStorage.getItem('revonix_mock_users') || '[]');
        const filteredUsers = users.filter((u: any) => u.id !== userId);
        localStorage.setItem('revonix_mock_users', JSON.stringify(filteredUsers));

        // Remove from profiles
        const profiles = JSON.parse(localStorage.getItem('revonix_mock_profiles') || '[]');
        const filteredProfiles = profiles.filter((p: any) => p.id !== userId);
        localStorage.setItem('revonix_mock_profiles', JSON.stringify(filteredProfiles));

        // Remove session
        localStorage.removeItem('revonix_mock_session');
        this.auth.signOut();
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }
}

const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
};

const realSupabase = (!isPlaceholderConfig && supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, options)
  : null;

export const supabase = realSupabase || (new MockSupabase() as any);
