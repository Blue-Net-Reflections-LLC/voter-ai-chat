import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Sql } from 'postgres';
import type { Bill, } from './types';
import ZeroShotClassifierSingleton from './ml/zero-shot-classifier';

export class BillsDataImporter {
    private sql: Sql;
    private classifier: InstanceType<typeof ZeroShotClassifierSingleton>;

    constructor(sql: Sql) {
        this.sql = sql;
        this.classifier = new ZeroShotClassifierSingleton();
    }

    private async classifyBill(title: string, description: string) {
        const text = `${title}\n${description}`;
        return this.classifier.classifyText(text);
    }

    async processDirectory(rootDir: string) {
        try {
            const states = await fs.readdir(rootDir);
            
            for (const state of states) {
                const statePath = path.join(rootDir, state);
                const stats = await fs.stat(statePath);
                
                if (!stats.isDirectory()) continue;
                
                const sessions = await fs.readdir(statePath);
                for (const session of sessions) {
                    const sessionPath = path.join(statePath, session);
                    const billsPath = path.join(sessionPath, 'bill');
                    
                    try {
                        const billFiles = await fs.readdir(billsPath);
                        for (const billFile of billFiles) {
                            if (!billFile.endsWith('.json')) continue;
                            
                            const filePath = path.join(billsPath, billFile);
                            const processed = await this.checkProcessStatus(filePath);
                            if (processed) continue;

                            try {
                                await this.updateProcessStatus(filePath, state, session, 'processing');
                                const fileContent = await fs.readFile(filePath, 'utf-8');
                                const jsonData = JSON.parse(fileContent);
                                const billData = jsonData.bill;
                                const categories = await this.classifyBill(billData.title, billData.description);
                                const bill: Bill = {
                                    billId: billData.bill_id,
                                    title: billData.title,
                                    description: billData.description,
                                    inferred_categories: categories,
                                    subjects: [],
                                    pdfUrl: billData.texts?.length > 0 ? billData.texts[billData.texts.length - 1].url : undefined,
                                    createdAt: new Date()
                                };
                                await this.storeBill(bill);

                                // Store bill-sponsor relationships if any
                                if (billData.sponsors) {
                                    for (const sponsor of billData.sponsors) {
                                        try {
                                            await this.sql`
                                                INSERT INTO bill_sponsors (bill_id, sponsor_id)
                                                VALUES (${bill.billId}, ${sponsor.people_id})
                                                ON CONFLICT (bill_id, sponsor_id) DO NOTHING
                                            `;
                                        } catch (err) {
                                            // Type guard for postgres error
                                            if (err && typeof err === 'object' && 'code' in err) {
                                                const error = err as { code: string };
                                                console.error(`Error linking sponsor ${sponsor.people_id} to bill ${bill.billId}:`, error);
                                                if (error.code === '23503') { // Foreign key violation
                                                    console.warn(`Sponsor ${sponsor.people_id} not found in sponsors table`);
                                                }
                                            } else {
                                                console.error(`Unknown error linking sponsor ${sponsor.people_id} to bill ${bill.billId}:`, err);
                                            }
                                        }
                                    }
                                }

                                await this.updateProcessStatus(filePath, state, session, 'completed');
                            } catch (error) {
                                console.error(`Error processing bill file ${filePath}:`, error);
                                await this.updateProcessStatus(filePath, state, session, 'failed');
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing session ${session} in state ${state}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing directory:', error);
            throw error;
        }
    }

    private async storeBill(bill: Bill) {
        const inferred_categories = bill.inferred_categories ? JSON.stringify(bill.inferred_categories) : null;
        const subjects = bill.subjects ? JSON.stringify(bill.subjects) : '[]';
        const pdfUrl = bill.pdfUrl ?? null;

        await this.sql`
            INSERT INTO bills (bill_id, title, description, inferred_categories, subjects, pdf_url, created_at)
            VALUES (${bill.billId}, ${bill.title}, ${bill.description}, ${inferred_categories}::jsonb, ${subjects}::jsonb, ${pdfUrl}, ${bill.createdAt})
            ON CONFLICT (bill_id) DO UPDATE
            SET title = ${bill.title},
                description = ${bill.description},
                inferred_categories = ${inferred_categories}::jsonb,
                subjects = ${subjects}::jsonb,
                pdf_url = ${pdfUrl}
        `;
    }

    private async checkProcessStatus(filePath: string): Promise<boolean> {
        const result = await this.sql`
            SELECT status FROM process_tracker 
            WHERE absolute_path = ${filePath} AND status = 'completed'
        `;
        return result.length > 0;
    }

    private async updateProcessStatus(
        filePath: string,
        state: string,
        session: string,
        status: 'pending' | 'processing' | 'completed' | 'failed'
    ) {
        await this.sql`
            INSERT INTO process_tracker 
            (absolute_path, file_type, state, session, status, updated_at)
            VALUES (${filePath}, 'bill', ${state}, ${session}, ${status}, CURRENT_TIMESTAMP)
            ON CONFLICT (absolute_path) DO UPDATE
            SET status = ${status},
                updated_at = CURRENT_TIMESTAMP
        `;
    }
}
