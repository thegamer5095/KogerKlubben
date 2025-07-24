import { createPool, Pool, PoolConnection } from "mysql2/promise";
import config from "../config.json";
// Database configuration
interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
}

// Default configuration - you should update these values with your actual database credentials
const dbConfig: DatabaseConfig = {
  host: config.database.DB_HOST || "localhost",
  user: config.database.DB_USER || "root",
  password: config.database.DB_PASSWORD || "",
  database: config.database.DB_NAME || "your_database",
  port: parseInt(config.database.DB_PORT || "3306"),
  connectionLimit: 10,
};

// Create a pool that can be reused
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    try {
      this.pool = createPool(dbConfig);
      console.log(
        `[Database] Successfully created connection pool to ${dbConfig.host}:${dbConfig.port}`
      );
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      throw error;
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async getConnection(): Promise<PoolConnection> {
    try {
      const connection = await this.pool.getConnection();
      console.log("[Database] Successfully acquired new connection");
      return connection;
    } catch (error) {
      console.error("[Database] Failed to acquire connection:", error);
      throw error;
    }
  }

  public async query<T>(sql: string, values?: any[]): Promise<T> {
    try {
      const [rows] = await this.pool.execute(sql, values);
      return rows as T;
    } catch (error) {
      console.error("[Database] Query execution failed:", error);
      throw error;
    }
  }

  public async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      console.log("[Database] Transaction started");
      const result = await callback(connection);
      await connection.commit();
      console.log("[Database] Transaction committed successfully");
      return result;
    } catch (error) {
      console.error("[Database] Transaction failed, rolling back:", error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      console.log("[Database] Connection released");
    }
  }
}

// Export a singleton instance
export const db = Database.getInstance();
