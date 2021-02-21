import * as AWS from "aws-sdk";
import * as crypto from "crypto";

export abstract class DynamoDbRepository<T> {
    protected client: AWS.DynamoDB.DocumentClient;

    constructor(protected tableName: string) {
        let dynamoOptions = undefined;
        if (!!process.env.IS_OFFLINE) {
            dynamoOptions = {
                region: "localhost",
                endpoint: "http://localhost:8000",
                accessKeyId: "DEFAULT_ACCESS_KEY",  // needed if you don't have aws credentials at all in env
                secretAccessKey: "DEFAULT_SECRET" // needed if you don't have aws credentials at all in env
            };
        }
        this.client = new AWS.DynamoDB.DocumentClient(dynamoOptions);
    }

    abstract toDomainObject(dataObject: any): T;

    abstract toDataObject(domainObject: T): any;

    save(model: T): Promise<void> {
        return new Promise((resolve, reject) => {
            const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
                TableName: this.tableName,
                Item: this.toDataObject(model)
            };
            this.client.put(params, () => {
                resolve();
            });
        });
    }

    get(id): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
                TableName: this.tableName,
                Key: {
                    id: id
                }
            };
            this.client.get(params, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    if (result.Item) {
                        let item = this.toDomainObject(result.Item);
                        resolve(item);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    delete(id): Promise<void> {
        return new Promise((resolve, reject) => {
            const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
                TableName: this.tableName,
                Key: {
                    id: id
                }
            };
            this.client.delete(params, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    protected encrypt(unencrypted?: string): string {
        if (!unencrypted) {
            return null;
        }

        let algorithm = "aes256";
        let key = process.env.DB_ENCRYPTION_KEY;

        let cipher = crypto.createCipher(algorithm, key);
        let encrypted =
            cipher.update(unencrypted, "utf8", "hex") + cipher.final("hex");

        return encrypted;
    }

    protected decrypt(encrypted?: string): string {
        if (!encrypted) {
            return null;
        }

        let algorithm = "aes256";
        let key = process.env.DB_ENCRYPTION_KEY;

        let decipher = crypto.createDecipher(algorithm, key);
        let decrypted =
            decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");

        return decrypted;
    }
}
