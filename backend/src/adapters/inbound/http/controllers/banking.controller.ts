import { Request, Response } from "express";
import { BankingService } from "../../../../core/application/services/banking.service.js";

/**
 * Handles Banking-related endpoints:
 * - GET /banking/records?shipId&year
 * - POST /banking/bank
 * - POST /banking/apply
 */
export class BankingController {
    constructor(private readonly bankingService: BankingService) {}

    /**
     * GET /banking/records?shipId&year
     * Fetch all banking records for a ship (optionally filter by year)
     */
    getBankingRecords = async (req: Request, res: Response): Promise<void> => {
        try {
            const shipId = Number(req.query.shipId);
            const year = req.query.year ? Number(req.query.year) : undefined;

            if (!shipId) {
                res.status(400).json({ success: false, message: "shipId is required" });
                return;
            }

            const records = await this.bankingService.getShipBankEntries(shipId);
            const filtered = year ? records.filter(r => r.year === year) : records;

            res.status(200).json({ success: true, data: filtered });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    /**
     * POST /banking/bank
     * Body: { shipId, year, amountGco2eq }
     * Store positive CB (surplus) for future use
     */
    bankPositiveCB = async (req: Request, res: Response): Promise<void> => {
        try {
            const { shipId, year, amountGco2eq } = req.body;

            if (!shipId || !year || typeof amountGco2eq !== "number") {
                res.status(400).json({ success: false, message: "Missing or invalid parameters" });
                return;
            }

            if (amountGco2eq <= 0) {
                res.status(400).json({ success: false, message: "Only positive CB can be banked" });
                return;
            }

            const record = await this.bankingService.addBankEntry(shipId, year, amountGco2eq);
            res.status(201).json({ success: true, data: record });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    };

    /**
     * POST /banking/apply
     * Body: { shipId, year, applyAmount }
     * Apply banked CB to offset a deficit (negative CB)
     */
    applyBankedCB = async (req: Request, res: Response): Promise<void> => {
        try {
            const { shipId, year, applyAmount } = req.body;

            if (!shipId || !year || typeof applyAmount !== "number") {
                res.status(400).json({ success: false, message: "Missing or invalid parameters" });
                return;
            }

            if (applyAmount <= 0) {
                res.status(400).json({ success: false, message: "applyAmount must be positive" });
                return;
            }

            // Compute available balance
            const totalAvailable = await this.bankingService.computeTotalSurplus(shipId);

            if (applyAmount > totalAvailable) {
                res.status(400).json({
                    success: false,
                    message: `Insufficient balance. Available: ${totalAvailable}`,
                });
                return;
            }

            // Apply (subtract) from the latest available entry
            const latestYear = year - 1; // Usually from previous year
            const updated = await this.bankingService.addBankEntry(shipId, latestYear, -applyAmount);

            res.status(200).json({
                success: true,
                message: `Applied ${applyAmount} from banked surplus`,
                data: updated,
            });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    };
}
