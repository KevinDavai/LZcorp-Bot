import { MongoClient } from "mongodb";

export class MongoDBService {
  private mongo: MongoClient;

  constructor(uri: string) {
    this.mongo = new MongoClient(uri);
  }

  async connect() {
    await this.mongo.connect();
  }

  async close() {
    await this.mongo.close();
  }
}
