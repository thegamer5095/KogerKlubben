"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = require("mysql2/promise");
const config_json_1 = __importDefault(require("../config.json"));
// Default configuration - you should update these values with your actual database credentials
const dbConfig = {
    host: config_json_1.default.database.DB_HOST || "localhost",
    user: config_json_1.default.database.DB_USER || "root",
    password: config_json_1.default.database.DB_PASSWORD || "",
    database: config_json_1.default.database.DB_NAME || "your_database",
    port: parseInt(config_json_1.default.database.DB_PORT || "3306"),
    connectionLimit: 10,
};
// Create a pool that can be reused
class Database {
    constructor() {
        try {
            this.pool = (0, promise_1.createPool)(dbConfig);
            console.log(`[Database] Successfully created connection pool to ${dbConfig.host}:${dbConfig.port}`);
        }
        catch (error) {
            console.error("[Database] Failed to create connection pool:", error);
            throw error;
        }
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async getConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log("[Database] Successfully acquired new connection");
            return connection;
        }
        catch (error) {
            console.error("[Database] Failed to acquire connection:", error);
            throw error;
        }
    }
    async query(sql, values) {
        try {
            const [rows] = await this.pool.execute(sql, values);
            return rows;
        }
        catch (error) {
            console.error("[Database] Query execution failed:", error);
            throw error;
        }
    }
    async transaction(callback) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            console.log("[Database] Transaction started");
            const result = await callback(connection);
            await connection.commit();
            console.log("[Database] Transaction committed successfully");
            return result;
        }
        catch (error) {
            console.error("[Database] Transaction failed, rolling back:", error);
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
            console.log("[Database] Connection released");
        }
    }
}
// Export a singleton instance
exports.db = Database.getInstance();
