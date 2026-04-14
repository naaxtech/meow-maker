// Cassanda configuration and utilities
import { Client, types } from 'cassandra-driver';

// Create a singleton client instance
let cassandraClient: Client | null = null;

export async function getCassandraClient(): Promise<Client> {
  if (cassandraClient) return cassandraClient;

  cassandraClient = new Client({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || 'localhost:9042').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DC || 'datacenter1',
    keyspace: process.env.CASSANDRA_KEYSPACE || 'erp',
    credentials: {
      username: process.env.CASSANDRA_USER || '',
      password: process.env.CASSANDRA_PASSWORD || '',
    },
    pooling: {
      coreConnectionsPerHost: {
        [types.distance.local]: 2,
        [types.distance.remote]: 1,
      },
    },
  });

  await cassandraClient.connect();
  return cassandraClient;
}

// Execute a query with automatic client management
export async function executeCassandra(
  query: string,
  params?: any[]
): Promise<types.ResultSet> {
  const client = await getCassandraClient();
  return client.execute(query, params, { prepare: true });
}

// Execute a batch of queries (for high-throughput writes)
export async function executeBatch(
  queries: Array<{ query: string; params?: any[] }>
): Promise<types.ResultSet> {
  const client = await getCassandraClient();
  return client.batch(queries, { prepare: true });
}

// Time-series optimized query helper
export async function queryTimeSeries(
  tableName: string,
  partitionKey: Record<string, any>,
  startTime?: Date,
  endTime?: Date,
  limit: number = 100
): Promise<any[]> {
  const client = await getCassandraClient();
  
  // Build query conditions
  const conditions: string[] = [];
  const params: any[] = [];
  
  Object.entries(partitionKey).forEach(([key, value]) => {
    conditions.push(`${key} = ?`);
    params.push(value);
  });
  
  if (startTime) {
    conditions.push('created_at >= ?');
    params.push(startTime);
  }
  
  if (endTime) {
    conditions.push('created_at <= ?');
    params.push(endTime);
  }
  
  const query = `
    SELECT * FROM ${tableName}
    WHERE ${conditions.join(' AND ')}
    LIMIT ${limit}
  `;
  
  const result = await client.execute(query, params, { prepare: true });
  return result.rows;
}

// Write with automatic timestamp (for idempotency)
export async function writeWithTimestamp(
  tableName: string,
  data: Record<string, any>
): Promise<void> {
  const client = await getCassandraClient();
  
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const params = Object.values(data);
  
  // Add timestamp for conflict resolution
  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')}, created_at)
    VALUES (${placeholders}, toTimestamp(now()))
    USING TTL 0
  `;
  
  await client.execute(query, params, { prepare: true });
}

// Counter operations (for real-time metrics)
export async function incrementCounter(
  tableName: string,
  key: Record<string, any>,
  counter: string,
  value: number = 1
): Promise<void> {
  const client = await getCassandraClient();
  
  const keyConditions = Object.entries(key)
    .map(([k]) => `${k} = ?`)
    .join(' AND ');
  
  const query = `
    UPDATE ${tableName}
    SET ${counter} = ${counter} + ?
    WHERE ${keyConditions}
  `;
  
  const params = [value, ...Object.values(key)];
  await client.execute(query, params, { prepare: true });
}

// Aggregation helper (lightweight - use Spark for complex aggregations)
export async function queryAggregates(
  tableName: string,
  partitionKey: Record<string, any>,
  aggregates: string[] = ['count', 'sum', 'avg']
): Promise<Record<string, number>> {
  const client = await getCassandraClient();
  
  const keyConditions = Object.entries(partitionKey)
    .map(([k]) => `${k} = ?`)
    .join(' AND ');
  
  const aggregateFns = aggregates.map(fn => {
    if (fn === 'count') return 'COUNT(*) as count';
    if (fn.startsWith('sum(')) return fn;
    if (fn.startsWith('avg(')) return fn;
    return fn;
  }).join(', ');
  
  const query = `
    SELECT ${aggregateFns} FROM ${tableName}
    WHERE ${keyConditions}
  `;
  
  const result = await client.execute(
    query, 
    Object.values(partitionKey), 
    { prepare: true }
  );
  
  return result.first() || {};
}

// Close connection (for cleanup)
export async function closeCassandra(): Promise<void> {
  if (cassandraClient) {
    await cassandraClient.shutdown();
    cassandraClient = null;
  }
}
